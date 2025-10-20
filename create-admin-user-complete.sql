-- =====================================================
-- SPEAKUP! - CREATE ADMIN USER (COMPLETE)
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor untuk membuat user admin

-- 1. Update existing user to admin role
UPDATE profiles 
SET 
  role = 'admin',
  is_verified = true,
  updated_at = NOW()
WHERE id = '11e1cc59-ab59-4d54-bc50-a99e8f940b3b';

-- 2. Atau buat user admin baru (jika belum ada di profiles)
INSERT INTO profiles (
  id,
  full_name,
  email,
  role,
  is_verified,
  privacy_profile,
  created_at,
  updated_at
) VALUES (
  '11e1cc59-ab59-4d54-bc50-a99e8f940b3b',
  'Gressandhy Rangga',
  'gressandhyrangga@gmail.com',
  'admin',
  true,
  'verified',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  is_verified = true,
  updated_at = NOW();

-- 3. Buat function untuk check admin access
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_uuid 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Buat function untuk get admin list
CREATE OR REPLACE FUNCTION get_admin_list()
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.created_at,
    au.last_sign_in_at as last_login
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.role = 'admin'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Buat function untuk promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(
  target_user_id UUID,
  promoted_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(promoted_by) THEN
    RAISE EXCEPTION 'Only admins can promote users to admin';
  END IF;
  
  -- Check if target user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;
  
  -- Promote user to admin
  UPDATE profiles 
  SET 
    role = 'admin',
    is_verified = true,
    updated_at = NOW()
  WHERE id = target_user_id;
  
  -- Log the promotion
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    activity_data,
    ip_address
  ) VALUES (
    promoted_by,
    'admin_promotion',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'action', 'promote_to_admin'
    ),
    inet_client_addr()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Buat function untuk demote admin
CREATE OR REPLACE FUNCTION demote_from_admin(
  target_user_id UUID,
  demoted_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user is admin
  IF NOT is_admin(demoted_by) THEN
    RAISE EXCEPTION 'Only admins can demote other admins';
  END IF;
  
  -- Prevent self-demotion
  IF target_user_id = demoted_by THEN
    RAISE EXCEPTION 'Cannot demote yourself';
  END IF;
  
  -- Check if target user is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = target_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Target user is not an admin';
  END IF;
  
  -- Demote admin to regular user
  UPDATE profiles 
  SET 
    role = 'user',
    updated_at = NOW()
  WHERE id = target_user_id;
  
  -- Log the demotion
  INSERT INTO user_activity_log (
    user_id,
    activity_type,
    activity_data,
    ip_address
  ) VALUES (
    demoted_by,
    'admin_demotion',
    jsonb_build_object(
      'target_user_id', target_user_id,
      'action', 'demote_from_admin'
    ),
    inet_client_addr()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Buat function untuk get admin permissions
CREATE OR REPLACE FUNCTION get_admin_permissions()
RETURNS TABLE (
  permission_name TEXT,
  description TEXT,
  is_enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'moderate_petitions' as permission_name,
    'Can moderate petitions (approve, reject, publish)' as description,
    true as is_enabled
    
  UNION ALL
  
  SELECT 
    'view_all_petitions' as permission_name,
    'Can view all petitions regardless of status' as description,
    true as is_enabled
    
  UNION ALL
  
  SELECT 
    'manage_users' as permission_name,
    'Can promote/demote users and manage roles' as description,
    true as is_enabled
    
  UNION ALL
  
  SELECT 
    'view_analytics' as permission_name,
    'Can view admin analytics and statistics' as description,
    true as is_enabled
    
  UNION ALL
  
  SELECT 
    'manage_settings' as permission_name,
    'Can modify app settings and configurations' as description,
    true as is_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Buat function untuk check specific admin permission
CREATE OR REPLACE FUNCTION has_admin_permission(
  permission_name TEXT,
  user_uuid UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is admin first
  IF NOT is_admin(user_uuid) THEN
    RETURN FALSE;
  END IF;
  
  -- Check specific permission
  RETURN EXISTS (
    SELECT 1 FROM get_admin_permissions() 
    WHERE permission_name = has_admin_permission.permission_name 
    AND is_enabled = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Update RLS policies untuk admin access
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view moderation logs" ON petition_moderation_log;

-- Create new admin policies
CREATE POLICY "Admins can view moderation logs" ON petition_moderation_log
FOR SELECT USING (is_admin());

CREATE POLICY "Admins can view all petitions" ON petitions
FOR SELECT USING (is_admin() OR status = 'published');

CREATE POLICY "Admins can update petition status" ON petitions
FOR UPDATE USING (is_admin());

-- 10. Buat view untuk admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM petitions WHERE status = 'pending') as pending_petitions,
  (SELECT COUNT(*) FROM petitions WHERE status = 'approved') as approved_petitions,
  (SELECT COUNT(*) FROM petitions WHERE status = 'rejected') as rejected_petitions,
  (SELECT COUNT(*) FROM petitions WHERE status = 'published') as published_petitions,
  (SELECT COUNT(*) FROM petition_signatures WHERE created_at >= CURRENT_DATE) as signatures_today,
  (SELECT COUNT(*) FROM petition_comments WHERE created_at >= CURRENT_DATE) as comments_today,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE) as new_users_today;

-- 11. Buat function untuk get admin activity log
CREATE OR REPLACE FUNCTION get_admin_activity_log(
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  admin_name TEXT,
  activity_type TEXT,
  activity_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ual.id,
    p.full_name as admin_name,
    ual.activity_type,
    ual.activity_data,
    ual.created_at
  FROM user_activity_log ual
  JOIN profiles p ON p.id = ual.user_id
  WHERE p.role = 'admin'
  AND ual.activity_type IN (
    'admin_promotion',
    'admin_demotion',
    'petition_moderation',
    'settings_change'
  )
  ORDER BY ual.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Test query - cek apakah admin berhasil dibuat
SELECT 
  id, 
  full_name, 
  email, 
  role, 
  is_verified,
  created_at
FROM profiles 
WHERE id = '11e1cc59-ab59-4d54-bc50-a99e8f940b3b';

-- 13. Test admin function
SELECT is_admin('11e1cc59-ab59-4d54-bc50-a99e8f940b3b') as is_admin_user;

-- 14. Cek daftar admin
SELECT * FROM get_admin_list();

-- =====================================================
-- SETUP SELESAI!
-- =====================================================
-- 
-- Admin berhasil dibuat dengan:
-- UUID: 11e1cc59-ab59-4d54-bc50-a99e8f940b3b
-- Email: gressandhyrangga@gmail.com
-- Role: admin
-- 
-- Langkah selanjutnya:
-- 1. Login dengan user admin tersebut
-- 2. Buka halaman admin-petitions-desktop.html
-- 3. Test moderasi aspirasi
-- 
-- =====================================================
