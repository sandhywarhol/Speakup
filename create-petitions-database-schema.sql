-- =====================================================
-- SPEAKUP! PETITIONS/ASPIRASI - DATABASE SCHEMA
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor

-- 1. Tabel untuk menyimpan aspirasi/petisi
CREATE TABLE IF NOT EXISTS petitions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informasi dasar aspirasi
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- bullying, workplace, education, health, environment, other
    target VARCHAR(255) NOT NULL, -- Kepada siapa aspirasi ditujukan
    solution TEXT NOT NULL, -- Solusi yang diharapkan
    signature_target INTEGER DEFAULT 100, -- Target jumlah tanda tangan
    
    -- Status moderasi
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, published
    moderation_notes TEXT, -- Catatan dari admin
    moderated_by UUID REFERENCES auth.users(id), -- Admin yang memoderasi
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    -- Informasi verifikasi pembuat
    full_name VARCHAR(255) NOT NULL,
    nik VARCHAR(16) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- File uploads
    ktp_url TEXT, -- URL foto KTP
    evidence_photos TEXT[], -- Array URL foto bukti
    evidence_video_url TEXT, -- URL video bukti
    documents_url TEXT[], -- Array URL dokumen pendukung
    additional_info TEXT, -- Informasi tambahan tentang bukti
    
    -- Tanda tangan digital
    digital_signature TEXT, -- Base64 encoded signature
    
    -- Statistik
    signature_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE, -- Aspirasi unggulan
    is_pinned BOOLEAN DEFAULT FALSE, -- Aspirasi yang dipasang di atas
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE -- Kapan dipublikasikan
);

-- 2. Tabel untuk menyimpan tanda tangan aspirasi
CREATE TABLE IF NOT EXISTS petition_signatures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Bisa null untuk anonim
    
    -- Informasi penandatangan
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    -- Tanda tangan digital
    signature_data TEXT, -- Base64 encoded signature
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel untuk menyimpan dukungan/dukungan aspirasi
CREATE TABLE IF NOT EXISTS petition_supporters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(petition_id, user_id)
);

-- 4. Tabel untuk menyimpan komentar aspirasi
CREATE TABLE IF NOT EXISTS petition_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES petition_comments(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT TRUE, -- Komentar bisa dimoderasi juga
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabel untuk menyimpan notifikasi terkait aspirasi
CREATE TABLE IF NOT EXISTS petition_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- status_change, new_signature, new_comment, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabel untuk menyimpan riwayat moderasi
CREATE TABLE IF NOT EXISTS petition_moderation_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    petition_id UUID NOT NULL REFERENCES petitions(id) ON DELETE CASCADE,
    moderator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL, -- approve, reject, request_changes, publish
    notes TEXT,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Buat indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_petitions_user_id ON petitions(user_id);
CREATE INDEX IF NOT EXISTS idx_petitions_status ON petitions(status);
CREATE INDEX IF NOT EXISTS idx_petitions_category ON petitions(category);
CREATE INDEX IF NOT EXISTS idx_petitions_created_at ON petitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_petitions_published_at ON petitions(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_petitions_signature_count ON petitions(signature_count DESC);
CREATE INDEX IF NOT EXISTS idx_petitions_is_featured ON petitions(is_featured);
CREATE INDEX IF NOT EXISTS idx_petitions_is_pinned ON petitions(is_pinned);

CREATE INDEX IF NOT EXISTS idx_petition_signatures_petition_id ON petition_signatures(petition_id);
CREATE INDEX IF NOT EXISTS idx_petition_signatures_user_id ON petition_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_petition_signatures_created_at ON petition_signatures(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_petition_supporters_petition_id ON petition_supporters(petition_id);
CREATE INDEX IF NOT EXISTS idx_petition_supporters_user_id ON petition_supporters(user_id);

CREATE INDEX IF NOT EXISTS idx_petition_comments_petition_id ON petition_comments(petition_id);
CREATE INDEX IF NOT EXISTS idx_petition_comments_user_id ON petition_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_petition_comments_created_at ON petition_comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_petition_notifications_user_id ON petition_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_petition_notifications_is_read ON petition_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_petition_notifications_created_at ON petition_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_petition_moderation_log_petition_id ON petition_moderation_log(petition_id);
CREATE INDEX IF NOT EXISTS idx_petition_moderation_log_moderator_id ON petition_moderation_log(moderator_id);
CREATE INDEX IF NOT EXISTS idx_petition_moderation_log_created_at ON petition_moderation_log(created_at DESC);

-- 8. Buat triggers untuk updated_at
CREATE TRIGGER update_petitions_updated_at 
    BEFORE UPDATE ON petitions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_petition_comments_updated_at 
    BEFORE UPDATE ON petition_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Buat function untuk update signature count
CREATE OR REPLACE FUNCTION update_petition_signature_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE petitions 
        SET signature_count = signature_count + 1 
        WHERE id = NEW.petition_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE petitions 
        SET signature_count = signature_count - 1 
        WHERE id = OLD.petition_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 10. Buat trigger untuk update signature count
CREATE TRIGGER update_petition_signature_count_trigger
    AFTER INSERT OR DELETE ON petition_signatures
    FOR EACH ROW EXECUTE FUNCTION update_petition_signature_count();

-- 11. Buat function untuk log moderasi
CREATE OR REPLACE FUNCTION log_petition_moderation()
RETURNS TRIGGER AS $$
BEGIN
    -- Log perubahan status
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO petition_moderation_log (
            petition_id, 
            moderator_id, 
            action, 
            previous_status, 
            new_status, 
            notes
        ) VALUES (
            NEW.id, 
            NEW.moderated_by, 
            CASE 
                WHEN NEW.status = 'approved' THEN 'approve'
                WHEN NEW.status = 'rejected' THEN 'reject'
                WHEN NEW.status = 'published' THEN 'publish'
                ELSE 'status_change'
            END,
            OLD.status, 
            NEW.status, 
            NEW.moderation_notes
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Buat trigger untuk log moderasi
CREATE TRIGGER log_petition_moderation_trigger
    AFTER UPDATE ON petitions
    FOR EACH ROW EXECUTE FUNCTION log_petition_moderation();

-- 13. Buat function untuk mendapatkan aspirasi yang dipublikasikan
CREATE OR REPLACE FUNCTION get_published_petitions(
    p_category VARCHAR DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    category VARCHAR,
    target VARCHAR,
    solution TEXT,
    signature_count INTEGER,
    signature_target INTEGER,
    view_count INTEGER,
    is_featured BOOLEAN,
    is_pinned BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    author_name VARCHAR,
    author_identity VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.category,
        p.target,
        p.solution,
        p.signature_count,
        p.signature_target,
        p.view_count,
        p.is_featured,
        p.is_pinned,
        p.created_at,
        p.published_at,
        p.full_name as author_name,
        'anonymous' as author_identity -- Selalu anonymous untuk privacy
    FROM petitions p
    WHERE p.status = 'published'
    AND (p_category IS NULL OR p.category = p_category)
    ORDER BY 
        p.is_pinned DESC,
        p.is_featured DESC,
        p.signature_count DESC,
        p.published_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Buat function untuk mendapatkan detail aspirasi
CREATE OR REPLACE FUNCTION get_petition_details(p_petition_id UUID)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    category VARCHAR,
    target VARCHAR,
    solution TEXT,
    signature_count INTEGER,
    signature_target INTEGER,
    view_count INTEGER,
    is_featured BOOLEAN,
    is_pinned BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    author_name VARCHAR,
    additional_info TEXT
) AS $$
BEGIN
    -- Update view count
    UPDATE petitions 
    SET view_count = view_count + 1 
    WHERE id = p_petition_id AND status = 'published';
    
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.category,
        p.target,
        p.solution,
        p.signature_count,
        p.signature_target,
        p.view_count,
        p.is_featured,
        p.is_pinned,
        p.created_at,
        p.published_at,
        p.full_name as author_name,
        p.additional_info
    FROM petitions p
    WHERE p.id = p_petition_id AND p.status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Buat function untuk menandatangani aspirasi
CREATE OR REPLACE FUNCTION sign_petition(
    p_petition_id UUID,
    p_full_name VARCHAR,
    p_email VARCHAR DEFAULT NULL,
    p_phone VARCHAR DEFAULT NULL,
    p_signature_data TEXT DEFAULT NULL,
    p_is_anonymous BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    signature_id UUID;
    current_user_id UUID;
BEGIN
    -- Get current user ID (bisa null untuk anonim)
    current_user_id := auth.uid();
    
    -- Check if petition exists and is published
    IF NOT EXISTS (SELECT 1 FROM petitions WHERE id = p_petition_id AND status = 'published') THEN
        RAISE EXCEPTION 'Petition not found or not published';
    END IF;
    
    -- Check if user already signed (jika ada user_id)
    IF current_user_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM petition_signatures WHERE petition_id = p_petition_id AND user_id = current_user_id) THEN
            RAISE EXCEPTION 'User already signed this petition';
        END IF;
    END IF;
    
    -- Insert signature
    INSERT INTO petition_signatures (
        petition_id,
        user_id,
        full_name,
        email,
        phone,
        signature_data,
        is_anonymous,
        ip_address
    ) VALUES (
        p_petition_id,
        current_user_id,
        p_full_name,
        p_email,
        p_phone,
        p_signature_data,
        p_is_anonymous,
        inet_client_addr()
    ) RETURNING id INTO signature_id;
    
    RETURN signature_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Enable RLS (Row Level Security)
ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_supporters ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE petition_moderation_log ENABLE ROW LEVEL SECURITY;

-- 17. Buat RLS policies

-- Policies untuk petitions
CREATE POLICY "Anyone can view published petitions" ON petitions
    FOR SELECT USING (status = 'published');

CREATE POLICY "Users can view their own petitions" ON petitions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create petitions" ON petitions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending petitions" ON petitions
    FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- Policies untuk petition_signatures
CREATE POLICY "Anyone can view signatures of published petitions" ON petition_signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM petitions p 
            WHERE p.id = petition_signatures.petition_id 
            AND p.status = 'published'
        )
    );

CREATE POLICY "Users can view their own signatures" ON petition_signatures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can sign published petitions" ON petition_signatures
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM petitions p 
            WHERE p.id = petition_signatures.petition_id 
            AND p.status = 'published'
        )
    );

-- Policies untuk petition_supporters
CREATE POLICY "Anyone can view supporters of published petitions" ON petition_supporters
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM petitions p 
            WHERE p.id = petition_supporters.petition_id 
            AND p.status = 'published'
        )
    );

CREATE POLICY "Users can manage their own support" ON petition_supporters
    FOR ALL USING (auth.uid() = user_id);

-- Policies untuk petition_comments
CREATE POLICY "Anyone can view comments of published petitions" ON petition_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM petitions p 
            WHERE p.id = petition_comments.petition_id 
            AND p.status = 'published'
        )
    );

CREATE POLICY "Authenticated users can comment on published petitions" ON petition_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM petitions p 
            WHERE p.id = petition_comments.petition_id 
            AND p.status = 'published'
        )
    );

CREATE POLICY "Users can update their own comments" ON petition_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies untuk petition_notifications
CREATE POLICY "Users can view their own notifications" ON petition_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON petition_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Policies untuk petition_moderation_log (admin only)
CREATE POLICY "Admins can view moderation logs" ON petition_moderation_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin'
        )
    );

-- 18. Buat function untuk admin moderasi
CREATE OR REPLACE FUNCTION moderate_petition(
    p_petition_id UUID,
    p_action VARCHAR, -- 'approve', 'reject', 'publish'
    p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id UUID;
    is_admin BOOLEAN;
    new_status VARCHAR;
BEGIN
    current_user_id := auth.uid();
    
    -- Check if user is admin
    SELECT EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = current_user_id 
        AND p.role = 'admin'
    ) INTO is_admin;
    
    IF NOT is_admin THEN
        RAISE EXCEPTION 'Only admins can moderate petitions';
    END IF;
    
    -- Determine new status
    new_status := CASE p_action
        WHEN 'approve' THEN 'approved'
        WHEN 'reject' THEN 'rejected'
        WHEN 'publish' THEN 'published'
        ELSE p_action
    END;
    
    -- Update petition
    UPDATE petitions 
    SET 
        status = new_status,
        moderation_notes = p_notes,
        moderated_by = current_user_id,
        moderated_at = NOW(),
        published_at = CASE WHEN new_status = 'published' THEN NOW() ELSE published_at END
    WHERE id = p_petition_id;
    
    -- Create notification for petition creator
    INSERT INTO petition_notifications (
        user_id,
        petition_id,
        notification_type,
        title,
        message
    ) 
    SELECT 
        p.user_id,
        p_petition_id,
        'status_change',
        'Status Aspirasi Diperbarui',
        'Aspirasi "' || p.title || '" telah ' || 
        CASE new_status
            WHEN 'approved' THEN 'disetujui'
            WHEN 'rejected' THEN 'ditolak'
            WHEN 'published' THEN 'dipublikasikan'
            ELSE 'diperbarui'
        END ||
        CASE WHEN p_notes IS NOT NULL THEN '. Catatan: ' || p_notes ELSE '' END
    FROM petitions p 
    WHERE p.id = p_petition_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Buat function untuk mendapatkan aspirasi yang perlu dimoderasi
CREATE OR REPLACE FUNCTION get_petitions_for_moderation(
    p_status VARCHAR DEFAULT 'pending',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    category VARCHAR,
    target VARCHAR,
    full_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR,
    moderation_notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.description,
        p.category,
        p.target,
        p.full_name,
        p.email,
        p.phone,
        p.created_at,
        p.status,
        p.moderation_notes
    FROM petitions p
    WHERE p.status = p_status
    ORDER BY p.created_at ASC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. Insert default categories
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('petition_categories', '["bullying", "workplace", "education", "health", "environment", "discrimination", "corruption", "other"]', 'json', 'Kategori aspirasi yang tersedia', true),
('petition_min_signature_target', '100', 'number', 'Target minimum tanda tangan untuk aspirasi', true),
('petition_max_signature_target', '100000', 'number', 'Target maksimum tanda tangan untuk aspirasi', true),
('petition_auto_approve', 'false', 'boolean', 'Apakah aspirasi otomatis disetujui', false)
ON CONFLICT (setting_key) DO NOTHING;

-- 21. Comments untuk dokumentasi
COMMENT ON TABLE petitions IS 'Tabel utama untuk menyimpan aspirasi/petisi dengan sistem moderasi';
COMMENT ON TABLE petition_signatures IS 'Tabel untuk menyimpan tanda tangan aspirasi';
COMMENT ON TABLE petition_supporters IS 'Tabel untuk menyimpan dukungan aspirasi';
COMMENT ON TABLE petition_comments IS 'Tabel untuk menyimpan komentar aspirasi';
COMMENT ON TABLE petition_notifications IS 'Tabel untuk menyimpan notifikasi terkait aspirasi';
COMMENT ON TABLE petition_moderation_log IS 'Tabel untuk menyimpan riwayat moderasi aspirasi';

-- =====================================================
-- SETUP SELESAI!
-- =====================================================
-- 
-- Langkah selanjutnya:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Pastikan user admin sudah ada di tabel profiles dengan role = 'admin'
-- 3. Test fungsi-fungsi yang sudah dibuat
-- 4. Integrasikan dengan frontend
-- 
-- =====================================================
