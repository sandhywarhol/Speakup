-- =====================================================
-- UPDATE PETITIONS TABLE FOR ADMIN MODERATION
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor untuk menambahkan kolom moderasi

-- 1. Tambahkan kolom moderasi jika belum ada
DO $$ 
BEGIN
    -- Tambahkan kolom moderation_notes jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'petitions' 
        AND column_name = 'moderation_notes'
    ) THEN
        ALTER TABLE petitions ADD COLUMN moderation_notes TEXT;
        RAISE NOTICE 'Added moderation_notes column to petitions table';
    END IF;

    -- Tambahkan kolom moderated_by jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'petitions' 
        AND column_name = 'moderated_by'
    ) THEN
        ALTER TABLE petitions ADD COLUMN moderated_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added moderated_by column to petitions table';
    END IF;

    -- Tambahkan kolom moderated_at jika belum ada
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'petitions' 
        AND column_name = 'moderated_at'
    ) THEN
        ALTER TABLE petitions ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added moderated_at column to petitions table';
    END IF;
END $$;

-- 2. Update RLS policies untuk admin moderation
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all petitions" ON petitions;
DROP POLICY IF EXISTS "Admins can update all petitions" ON petitions;

-- Create new admin policies
CREATE POLICY "Admins can view all petitions" ON petitions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all petitions" ON petitions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 3. Function untuk approve petition
CREATE OR REPLACE FUNCTION approve_petition(
    p_petition_id UUID,
    p_moderation_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = current_user_id 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can approve petitions';
    END IF;
    
    -- Update the petition status
    UPDATE petitions
    SET 
        status = 'approved',
        moderation_notes = p_moderation_notes,
        moderated_by = current_user_id,
        moderated_at = NOW()
    WHERE id = p_petition_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function untuk reject petition
CREATE OR REPLACE FUNCTION reject_petition(
    p_petition_id UUID,
    p_moderation_notes TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if current user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = current_user_id 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Only admins can reject petitions';
    END IF;
    
    -- Check if moderation notes is provided
    IF p_moderation_notes IS NULL OR TRIM(p_moderation_notes) = '' THEN
        RAISE EXCEPTION 'Moderation notes are required when rejecting a petition';
    END IF;
    
    -- Update the petition status
    UPDATE petitions
    SET 
        status = 'rejected',
        moderation_notes = p_moderation_notes,
        moderated_by = current_user_id,
        moderated_at = NOW()
    WHERE id = p_petition_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Function untuk get petition statistics
CREATE OR REPLACE FUNCTION get_petition_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'pending', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
    ) INTO result
    FROM petitions;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION approve_petition(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_petition(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_petition_stats() TO authenticated;

-- 7. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status);
CREATE INDEX IF NOT EXISTS idx_petitions_moderated_by ON petitions(moderated_by);
CREATE INDEX IF NOT EXISTS idx_petitions_moderated_at ON petitions(moderated_at);

-- 8. Success message
DO $$
BEGIN
    RAISE NOTICE 'Petitions table updated successfully for admin moderation!';
    RAISE NOTICE 'Added columns: moderation_notes, moderated_by, moderated_at';
    RAISE NOTICE 'Created functions: approve_petition, reject_petition, get_petition_stats';
    RAISE NOTICE 'Updated RLS policies for admin access';
END $$;


