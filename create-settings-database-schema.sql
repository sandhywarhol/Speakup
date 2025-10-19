-- Database Schema untuk Halaman Settings
-- Jalankan script ini di Supabase SQL Editor

-- 1. Tabel untuk menyimpan pengaturan notifikasi user
CREATE TABLE IF NOT EXISTS user_notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    push_notifications BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    notification_frequency VARCHAR(20) DEFAULT 'immediate', -- immediate, daily, weekly
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Tabel untuk menyimpan pengaturan privasi user
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_visibility VARCHAR(20) DEFAULT 'public', -- public, verified, private
    show_email BOOLEAN DEFAULT false,
    show_phone BOOLEAN DEFAULT false,
    show_activity_status BOOLEAN DEFAULT true,
    dm_permission VARCHAR(20) DEFAULT 'everyone', -- everyone, followers, none
    allow_comments BOOLEAN DEFAULT true,
    allow_mentions BOOLEAN DEFAULT true,
    search_engine_index BOOLEAN DEFAULT true,
    show_location BOOLEAN DEFAULT false,
    story_default_visibility VARCHAR(20) DEFAULT 'public', -- public, community, private
    allow_story_comments BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Tabel untuk menyimpan pengaturan keamanan user
CREATE TABLE IF NOT EXISTS user_security_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255), -- Untuk menyimpan secret 2FA
    backup_codes TEXT[], -- Array backup codes
    recovery_email VARCHAR(255), -- Email untuk pemulihan akun
    recovery_email_verified BOOLEAN DEFAULT false, -- Status verifikasi recovery email
    last_password_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_change_required BOOLEAN DEFAULT false,
    login_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. Tabel untuk menyimpan tanda tangan digital user
CREATE TABLE IF NOT EXISTS user_digital_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    signature_data TEXT, -- Base64 encoded signature image
    full_name VARCHAR(255),
    show_full_name BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel untuk menyimpan daftar blokir user
CREATE TABLE IF NOT EXISTS user_blocklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_username VARCHAR(255), -- Untuk user yang belum ada di sistem
    blocked_email VARCHAR(255), -- Untuk user yang belum ada di sistem
    reason VARCHAR(255), -- Alasan memblokir
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, blocked_user_id),
    UNIQUE(user_id, blocked_username),
    UNIQUE(user_id, blocked_email)
);

-- Buat foreign key relationship yang eksplisit
ALTER TABLE user_blocklist 
ADD CONSTRAINT fk_user_blocklist_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE user_blocklist 
ADD CONSTRAINT fk_user_blocklist_blocked_user_id 
FOREIGN KEY (blocked_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Tabel untuk menyimpan riwayat aktivitas user (untuk ekspor data)
CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50), -- login, logout, password_change, settings_change, etc.
    activity_data JSONB, -- Data tambahan dalam format JSON
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabel untuk menyimpan pengaturan aplikasi global
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string', -- string, boolean, number, json
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default app settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('maintenance_mode', 'false', 'boolean', 'Mode maintenance aplikasi', true),
('registration_enabled', 'true', 'boolean', 'Apakah registrasi user baru diizinkan', true),
('max_file_size_mb', '10', 'number', 'Ukuran maksimal file upload dalam MB', true),
('allowed_file_types', '["jpg", "jpeg", "png", "gif", "mp4", "mov"]', 'json', 'Tipe file yang diizinkan untuk upload', true),
('notification_retention_days', '30', 'number', 'Berapa hari notifikasi disimpan', false)
ON CONFLICT (setting_key) DO NOTHING;

-- 8. Buat indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user_id ON user_notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user_id ON user_privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_settings_user_id ON user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_digital_signatures_user_id ON user_digital_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocklist_user_id ON user_blocklist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocklist_blocked_user_id ON user_blocklist(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);

-- 9. Buat triggers untuk updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_notification_settings_updated_at 
    BEFORE UPDATE ON user_notification_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_privacy_settings_updated_at 
    BEFORE UPDATE ON user_privacy_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_security_settings_updated_at 
    BEFORE UPDATE ON user_security_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_digital_signatures_updated_at 
    BEFORE UPDATE ON user_digital_signatures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at 
    BEFORE UPDATE ON app_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Buat RLS (Row Level Security) policies
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_digital_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policies untuk user_notification_settings
CREATE POLICY "Users can view own notification settings" ON user_notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON user_notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON user_notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies untuk user_privacy_settings
CREATE POLICY "Users can view own privacy settings" ON user_privacy_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings" ON user_privacy_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings" ON user_privacy_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies untuk user_security_settings
CREATE POLICY "Users can view own security settings" ON user_security_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own security settings" ON user_security_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security settings" ON user_security_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies untuk user_digital_signatures
CREATE POLICY "Users can view own digital signatures" ON user_digital_signatures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own digital signatures" ON user_digital_signatures
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own digital signatures" ON user_digital_signatures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies untuk user_blocklist
CREATE POLICY "Users can view own blocklist" ON user_blocklist
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own blocklist" ON user_blocklist
    FOR ALL USING (auth.uid() = user_id);

-- Policies untuk user_activity_log
CREATE POLICY "Users can view own activity log" ON user_activity_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity log" ON user_activity_log
    FOR INSERT WITH CHECK (true);

-- Policies untuk app_settings
CREATE POLICY "Public settings are viewable by everyone" ON app_settings
    FOR SELECT USING (is_public = true);

CREATE POLICY "Authenticated users can view all settings" ON app_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- 11. Buat functions untuk operasi umum
CREATE OR REPLACE FUNCTION get_user_settings(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'notifications', (
            SELECT row_to_json(ns) FROM user_notification_settings ns 
            WHERE ns.user_id = user_uuid
        ),
        'privacy', (
            SELECT row_to_json(ps) FROM user_privacy_settings ps 
            WHERE ps.user_id = user_uuid
        ),
        'security', (
            SELECT row_to_json(ss) FROM user_security_settings ss 
            WHERE ss.user_id = user_uuid
        ),
        'signature', (
            SELECT row_to_json(ds) FROM user_digital_signatures ds 
            WHERE ds.user_id = user_uuid AND ds.is_active = true
        ),
        'blocklist', (
            SELECT array_agg(row_to_json(bl)) FROM user_blocklist bl 
            WHERE bl.user_id = user_uuid
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Buat function untuk ekspor data user
CREATE OR REPLACE FUNCTION export_user_data(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'user_id', user_uuid,
        'export_date', NOW(),
        'profile', (
            SELECT row_to_json(p) FROM profiles p WHERE p.id = user_uuid
        ),
        'posts', (
            SELECT array_agg(row_to_json(p)) FROM posts p WHERE p.user_id = user_uuid
        ),
        'comments', (
            SELECT array_agg(row_to_json(pc)) FROM post_comments pc WHERE pc.user_id = user_uuid
        ),
        'likes', (
            SELECT array_agg(row_to_json(pl)) FROM post_likes pl WHERE pl.user_id = user_uuid
        ),
        'saves', (
            SELECT array_agg(row_to_json(ps)) FROM post_saves ps WHERE ps.user_id = user_uuid
        ),
        'settings', get_user_settings(user_uuid),
        'activity_log', (
            SELECT array_agg(row_to_json(al)) FROM user_activity_log al 
            WHERE al.user_id = user_uuid 
            ORDER BY al.created_at DESC 
            LIMIT 1000
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Buat function untuk menghapus semua data user
CREATE OR REPLACE FUNCTION delete_user_data(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete dalam urutan yang benar untuk menghindari foreign key constraint
    DELETE FROM user_activity_log WHERE user_id = user_uuid;
    DELETE FROM user_blocklist WHERE user_id = user_uuid;
    DELETE FROM user_digital_signatures WHERE user_id = user_uuid;
    DELETE FROM user_security_settings WHERE user_id = user_uuid;
    DELETE FROM user_privacy_settings WHERE user_id = user_uuid;
    DELETE FROM user_notification_settings WHERE user_id = user_uuid;
    DELETE FROM post_saves WHERE user_id = user_uuid;
    DELETE FROM post_likes WHERE user_id = user_uuid;
    DELETE FROM post_comments WHERE user_id = user_uuid;
    DELETE FROM posts WHERE user_id = user_uuid;
    DELETE FROM profiles WHERE id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Buat function untuk log aktivitas
CREATE OR REPLACE FUNCTION log_user_activity(
    user_uuid UUID,
    activity_type VARCHAR(50),
    activity_data JSONB DEFAULT NULL,
    ip_address INET DEFAULT NULL,
    user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO user_activity_log (user_id, activity_type, activity_data, ip_address, user_agent)
    VALUES (user_uuid, activity_type, activity_data, ip_address, user_agent)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Buat function untuk inisialisasi pengaturan user baru
CREATE OR REPLACE FUNCTION initialize_user_settings(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Insert default notification settings
    INSERT INTO user_notification_settings (user_id) VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default privacy settings
    INSERT INTO user_privacy_settings (user_id) VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert default security settings
    INSERT INTO user_security_settings (user_id) VALUES (user_uuid)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Log aktivitas
    PERFORM log_user_activity(user_uuid, 'settings_initialized');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Buat trigger untuk auto-initialize settings saat user baru dibuat
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM initialize_user_settings(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger akan dijalankan saat ada user baru di auth.users
-- (Ini akan dijalankan manual atau melalui Supabase Auth hooks)

COMMENT ON TABLE user_notification_settings IS 'Pengaturan notifikasi user (push, email, frekuensi)';
COMMENT ON TABLE user_privacy_settings IS 'Pengaturan privasi user (visibilitas profil, DM, dll)';
COMMENT ON TABLE user_security_settings IS 'Pengaturan keamanan user (2FA, password, dll)';
COMMENT ON TABLE user_digital_signatures IS 'Tanda tangan digital user';
COMMENT ON TABLE user_blocklist IS 'Daftar user yang diblokir';
COMMENT ON TABLE user_activity_log IS 'Log aktivitas user untuk audit dan ekspor data';
COMMENT ON TABLE app_settings IS 'Pengaturan aplikasi global';

-- Selesai! Schema database untuk settings sudah siap.
