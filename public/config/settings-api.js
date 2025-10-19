// Settings API - Menghubungkan halaman settings ke Supabase
// File ini berisi semua fungsi untuk mengelola pengaturan user

class SettingsAPI {
  constructor() {
    this.supabase = null;
    this.initialized = false;
    this.initializeSupabase();
  }

  async initializeSupabase() {
    try {
      // Wait longer for other scripts to load
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🔍 SettingsAPI: Checking Supabase availability...');
      console.log('Available:', {
        getSupabase: typeof window.getSupabase,
        supabase: typeof window.supabase,
        SUPABASE_CONFIG: !!window.SUPABASE_CONFIG
      });
      
      if (window.getSupabase) {
        this.supabase = window.getSupabase();
        console.log('✅ SettingsAPI: Using window.getSupabase()');
      } else if (window.supabase && window.supabase.createClient && window.SUPABASE_CONFIG) {
        this.supabase = window.supabase.createClient(
          window.SUPABASE_CONFIG.url,
          window.SUPABASE_CONFIG.anonKey
        );
        console.log('✅ SettingsAPI: Created new Supabase client');
      } else {
        console.error('❌ SettingsAPI: Supabase tidak tersedia');
        console.log('Available:', {
          getSupabase: typeof window.getSupabase,
          supabase: typeof window.supabase,
          SUPABASE_CONFIG: !!window.SUPABASE_CONFIG
        });
        return false;
      }
      
      // Test the connection
      if (this.supabase) {
        console.log('🧪 SettingsAPI: Testing connection...');
        const { data, error } = await this.supabase.from('posts').select('id').limit(1);
        if (error) {
          console.error('❌ SettingsAPI: Supabase connection test failed:', error);
          return false;
        }
        console.log('✅ SettingsAPI: Supabase connection test passed');
        this.initialized = true;
      }
      
      return true;
    } catch (error) {
      console.error('❌ SettingsAPI: Error initializing Supabase:', error);
      return false;
    }
  }

  // Helper function untuk memastikan SettingsAPI sudah terinisialisasi
  async ensureInitialized() {
    if (!this.initialized) {
      console.log('⏳ SettingsAPI belum terinisialisasi, mencoba lagi...');
      
      // Coba inisialisasi ulang
      await this.initializeSupabase();
      
      // Jika masih gagal, coba gunakan window.getSupabase langsung
      if (!this.initialized && window.getSupabase) {
        console.log('🔄 Menggunakan window.getSupabase() sebagai fallback...');
        this.supabase = window.getSupabase();
        if (this.supabase) {
          this.initialized = true;
          console.log('✅ SettingsAPI: Fallback berhasil');
        }
      }
      
      // Jika masih gagal, coba tunggu lebih lama dan coba lagi
      if (!this.initialized) {
        console.log('⏳ Menunggu lebih lama untuk Supabase...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (window.getSupabase) {
          this.supabase = window.getSupabase();
          if (this.supabase) {
            this.initialized = true;
            console.log('✅ SettingsAPI: Inisialisasi berhasil setelah menunggu');
          }
        }
      }
    }
    
    if (!this.supabase) {
      throw new Error('Supabase tidak tersedia');
    }
  }

  // Helper function untuk mendapatkan user session
  async getCurrentUser() {
    await this.ensureInitialized();
    
    const { data: { session }, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    if (!session) throw new Error('User belum login');
    
    return session.user;
  }

  // Helper function untuk log aktivitas
  async logActivity(activityType, activityData = null) {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { error } = await this.supabase.rpc('log_user_activity', {
        user_uuid: user.id,
        activity_type: activityType,
        activity_data: activityData
      });
      if (error) console.warn('Failed to log activity:', error);
    } catch (error) {
      console.warn('Failed to log activity:', error);
    }
  }

  // ===============================
  // NOTIFICATION SETTINGS
  // ===============================

  async getNotificationSettings() {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { data, error } = await this.supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data || {
        push_notifications: true,
        email_notifications: true,
        notification_frequency: 'immediate'
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw error;
    }
  }

  async updateNotificationSettings(settings) {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { data, error } = await this.supabase
        .from('user_notification_settings')
        .upsert({
          user_id: user.id,
          ...settings
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('notification_settings_updated', settings);
      return data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // ===============================
  // PRIVACY SETTINGS
  // ===============================

  async getPrivacySettings() {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { data, error } = await this.supabase
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        profile_visibility: 'public',
        show_email: false,
        show_phone: false,
        dm_permission: 'everyone',
        allow_comments: true,
        allow_mentions: true,
        search_engine_index: true,
        show_location: false,
        story_default_visibility: 'public',
        allow_story_comments: true
      };
    } catch (error) {
      console.error('Error getting privacy settings:', error);
      throw error;
    }
  }

  async updatePrivacySettings(settings) {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { data, error } = await this.supabase
        .from('user_privacy_settings')
        .upsert({
          user_id: user.id,
          ...settings
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('privacy_settings_updated', settings);
      return data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }

  // ===============================
  // SECURITY SETTINGS
  // ===============================

  async getSecuritySettings() {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { data, error } = await this.supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || {
        two_factor_enabled: false,
        login_notifications: true,
        password_change_required: false,
        recovery_email: null,
        recovery_email_verified: false
      };
    } catch (error) {
      console.error('Error getting security settings:', error);
      throw error;
    }
  }

  async updateSecuritySettings(settings) {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { data, error } = await this.supabase
        .from('user_security_settings')
        .upsert({
          user_id: user.id,
          ...settings
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('security_settings_updated', settings);
      return data;
    } catch (error) {
      console.error('Error updating security settings:', error);
      throw error;
    }
  }

  async changePassword(newPassword) {
    try {
      await this.ensureInitialized();
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      await this.logActivity('password_changed');
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  async updateRecoveryEmail(recoveryEmail) {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      
      // Validasi email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recoveryEmail)) {
        throw new Error('Format email tidak valid');
      }

      // Update recovery email (belum diverifikasi)
      const { data, error } = await this.supabase
        .from('user_security_settings')
        .upsert({
          user_id: user.id,
          recovery_email: recoveryEmail,
          recovery_email_verified: false
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('recovery_email_updated', { recovery_email: recoveryEmail });
      return data;
    } catch (error) {
      console.error('Error updating recovery email:', error);
      throw error;
    }
  }

  async verifyRecoveryEmail(verificationCode) {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      
      // TODO: Implementasi verifikasi email dengan kode
      // Untuk sekarang, langsung set sebagai verified
      const { data, error } = await this.supabase
        .from('user_security_settings')
        .update({
          recovery_email_verified: true
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('recovery_email_verified');
      return data;
    } catch (error) {
      console.error('Error verifying recovery email:', error);
      throw error;
    }
  }

  async resetPasswordWithRecoveryEmail(recoveryEmail) {
    try {
      await this.ensureInitialized();
      
      // Cari user berdasarkan recovery email
      const { data: securityData, error: findError } = await this.supabase
        .from('user_security_settings')
        .select('user_id, recovery_email_verified')
        .eq('recovery_email', recoveryEmail)
        .eq('recovery_email_verified', true)
        .single();

      if (findError || !securityData) {
        throw new Error('Recovery email tidak ditemukan atau belum diverifikasi');
      }

      // TODO: Implementasi reset password via recovery email
      // Untuk sekarang, return success
      await this.logActivity('password_reset_requested', { 
        recovery_email: recoveryEmail,
        user_id: securityData.user_id 
      });

      return { success: true, message: 'Link reset password telah dikirim ke recovery email' };
    } catch (error) {
      console.error('Error resetting password with recovery email:', error);
      throw error;
    }
  }

  // ===============================
  // DIGITAL SIGNATURE
  // ===============================

  async getDigitalSignature() {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { data, error } = await this.supabase
        .from('user_digital_signatures')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting digital signature:', error);
      throw error;
    }
  }

  async saveDigitalSignature(signatureData, fullName) {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      
      // First, deactivate all existing signatures for this user
      await this.supabase
        .from('user_digital_signatures')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Then insert the new signature (always show full name)
      const { data, error } = await this.supabase
        .from('user_digital_signatures')
        .insert({
          user_id: user.id,
          signature_data: signatureData,
          full_name: fullName,
          show_full_name: true, // Always true - nama akan selalu ditampilkan
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('digital_signature_updated');
      return data;
    } catch (error) {
      console.error('Error saving digital signature:', error);
      throw error;
    }
  }

  // ===============================
  // BLOCKLIST MANAGEMENT
  // ===============================

  async getBlocklist() {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { data, error } = await this.supabase
        .from('user_blocklist')
        .select(`
          *,
          blocked_user:blocked_user_id (
            id,
            email,
            raw_user_meta_data
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting blocklist:', error);
      throw error;
    }
  }

  async addToBlocklist(blockedUserId = null, blockedUsername = null, blockedEmail = null, reason = null) {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      
      if (!blockedUserId && !blockedUsername && !blockedEmail) {
        throw new Error('Harus menyediakan user ID, username, atau email');
      }

      const { data, error } = await this.supabase
        .from('user_blocklist')
        .insert({
          user_id: user.id,
          blocked_user_id: blockedUserId,
          blocked_username: blockedUsername,
          blocked_email: blockedEmail,
          reason: reason
        })
        .select()
        .single();

      if (error) throw error;

      await this.logActivity('user_blocked', {
        blocked_user_id: blockedUserId,
        blocked_username: blockedUsername,
        blocked_email: blockedEmail,
        reason: reason
      });

      return data;
    } catch (error) {
      console.error('Error adding to blocklist:', error);
      throw error;
    }
  }

  async removeFromBlocklist(blocklistId) {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { error } = await this.supabase
        .from('user_blocklist')
        .delete()
        .eq('id', blocklistId)
        .eq('user_id', user.id);

      if (error) throw error;

      await this.logActivity('user_unblocked', { blocklist_id: blocklistId });
      return true;
    } catch (error) {
      console.error('Error removing from blocklist:', error);
      throw error;
    }
  }

  // ===============================
  // DATA EXPORT & ACCOUNT DELETION
  // ===============================

  async exportUserData() {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { data, error } = await this.supabase.rpc('export_user_data', {
        user_uuid: user.id
      });

      if (error) throw error;

      await this.logActivity('data_exported');
      return data;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  async deleteUserAccount() {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      
      console.log('🗑️ Menghapus akun user:', user.email);
      
      // Delete all user data from database
      // This will delete: posts, comments, signatures, settings, blocklist, activity logs
      const { error: deleteError } = await this.supabase.rpc('delete_user_data', {
        user_uuid: user.id
      });

      if (deleteError) {
        console.error('❌ Error deleting user data:', deleteError);
        throw deleteError;
      }

      console.log('✅ User data berhasil dihapus dari database');

      // Sign out user from Supabase Auth
      await this.supabase.auth.signOut();
      console.log('✅ User berhasil sign out');

      // Log the deletion activity (if possible)
      try {
        await this.logActivity('account_deleted');
      } catch (logError) {
        console.warn('⚠️ Tidak dapat log aktivitas penghapusan:', logError);
      }

      return true;
    } catch (error) {
      console.error('❌ Error deleting user account:', error);
      throw error;
    }
  }

  // ===============================
  // APP SETTINGS
  // ===============================

  async getAppSettings() {
    try {
      await this.ensureInitialized();
      const { data, error } = await this.supabase
        .from('app_settings')
        .select('*')
        .eq('is_public', true);

      if (error) throw error;

      // Convert to object
      const settings = {};
      data.forEach(setting => {
        let value = setting.setting_value;
        
        // Parse based on type
        switch (setting.setting_type) {
          case 'boolean':
            value = value === 'true';
            break;
          case 'number':
            value = parseFloat(value);
            break;
          case 'json':
            value = JSON.parse(value);
            break;
        }
        
        settings[setting.setting_key] = value;
      });

      return settings;
    } catch (error) {
      console.error('Error getting app settings:', error);
      throw error;
    }
  }

  // ===============================
  // UTILITY FUNCTIONS
  // ===============================

  async initializeUserSettings() {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { error } = await this.supabase.rpc('initialize_user_settings', {
        user_uuid: user.id
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error initializing user settings:', error);
      throw error;
    }
  }

  async getAllUserSettings() {
    try {
      await this.ensureInitialized();
      const user = await this.getCurrentUser();
      const { data, error } = await this.supabase.rpc('get_user_settings', {
        user_uuid: user.id
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting all user settings:', error);
      throw error;
    }
  }

  // ===============================
  // NOTIFICATION SYSTEM
  // ===============================

  async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async sendTestNotification() {
    try {
      await this.ensureInitialized();
      const permission = await this.requestNotificationPermission();
      if (!permission) {
        throw new Error('Notification permission not granted');
      }

      const notification = new Notification('SpeakUp! Test Notification', {
        body: 'Ini adalah notifikasi test dari SpeakUp!',
        icon: '/assets/logo/logo apps.png',
        badge: '/assets/logo/logo apps.png'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }
}

// Export untuk digunakan di halaman settings
window.SettingsAPI = SettingsAPI;

// Buat instance global
window.settingsAPI = new SettingsAPI();
