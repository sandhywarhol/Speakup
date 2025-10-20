-- =====================================================
-- SPEAKUP! PETITIONS - STORAGE SETUP
-- =====================================================
-- Jalankan script ini di Supabase SQL Editor untuk setup storage

-- 1. Buat bucket untuk petitions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'petitions',
  'petitions',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
);

-- 2. Buat policies untuk bucket petitions
CREATE POLICY "Anyone can view petition files" ON storage.objects
FOR SELECT USING (bucket_id = 'petitions');

CREATE POLICY "Authenticated users can upload petition files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'petitions' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own petition files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'petitions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own petition files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'petitions' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Buat function untuk generate unique filename
CREATE OR REPLACE FUNCTION generate_petition_filename(
  user_id UUID,
  file_type VARCHAR,
  original_filename TEXT
)
RETURNS TEXT AS $$
DECLARE
  file_extension TEXT;
  timestamp_str TEXT;
  random_str TEXT;
  new_filename TEXT;
BEGIN
  -- Extract file extension
  file_extension := substring(original_filename from '\.([^.]*)$');
  
  -- Generate timestamp
  timestamp_str := to_char(now(), 'YYYYMMDDHH24MISS');
  
  -- Generate random string
  random_str := substring(md5(random()::text) from 1 for 8);
  
  -- Create new filename
  new_filename := timestamp_str || '_' || random_str || '.' || file_extension;
  
  -- Return full path
  RETURN 'petitions/' || file_type || '/' || user_id::text || '/' || new_filename;
END;
$$ LANGUAGE plpgsql;

-- 4. Buat function untuk cleanup old files
CREATE OR REPLACE FUNCTION cleanup_old_petition_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Delete files older than 30 days that are not referenced in petitions table
  WITH old_files AS (
    SELECT name
    FROM storage.objects
    WHERE bucket_id = 'petitions'
    AND created_at < NOW() - INTERVAL '30 days'
    AND name NOT IN (
      SELECT unnest(ARRAY[
        COALESCE(ktp_url, ''),
        COALESCE(evidence_video_url, '')
      ] || COALESCE(evidence_photos, ARRAY[]::TEXT[]) || COALESCE(documents_url, ARRAY[]::TEXT[]))
      FROM petitions
      WHERE ktp_url IS NOT NULL 
         OR evidence_video_url IS NOT NULL 
         OR evidence_photos IS NOT NULL 
         OR documents_url IS NOT NULL
    )
  )
  DELETE FROM storage.objects
  WHERE name IN (SELECT name FROM old_files);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 5. Buat trigger untuk auto-cleanup saat petition dihapus
CREATE OR REPLACE FUNCTION cleanup_petition_files()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete KTP file
  IF OLD.ktp_url IS NOT NULL THEN
    DELETE FROM storage.objects WHERE name = OLD.ktp_url;
  END IF;
  
  -- Delete evidence photos
  IF OLD.evidence_photos IS NOT NULL THEN
    DELETE FROM storage.objects WHERE name = ANY(OLD.evidence_photos);
  END IF;
  
  -- Delete evidence video
  IF OLD.evidence_video_url IS NOT NULL THEN
    DELETE FROM storage.objects WHERE name = OLD.evidence_video_url;
  END IF;
  
  -- Delete documents
  IF OLD.documents_url IS NOT NULL THEN
    DELETE FROM storage.objects WHERE name = ANY(OLD.documents_url);
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_petition_files_trigger
  BEFORE DELETE ON petitions
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_petition_files();

-- 6. Buat function untuk get file info
CREATE OR REPLACE FUNCTION get_petition_file_info(file_url TEXT)
RETURNS TABLE (
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.name as file_name,
    o.metadata->>'size'::BIGINT as file_size,
    o.metadata->>'mimetype' as file_type,
    o.created_at
  FROM storage.objects o
  WHERE o.name = file_url
  AND o.bucket_id = 'petitions';
END;
$$ LANGUAGE plpgsql;

-- 7. Buat function untuk validate file upload
CREATE OR REPLACE FUNCTION validate_petition_file(
  file_size BIGINT,
  mime_type TEXT,
  file_extension TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  max_size BIGINT := 52428800; -- 50MB
  allowed_types TEXT[] := ARRAY[
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  allowed_extensions TEXT[] := ARRAY[
    'jpg', 'jpeg', 'png', 'gif', 'webp',
    'mp4', 'mov',
    'pdf', 'doc', 'docx'
  ];
BEGIN
  -- Check file size
  IF file_size > max_size THEN
    RETURN FALSE;
  END IF;
  
  -- Check MIME type
  IF NOT (mime_type = ANY(allowed_types)) THEN
    RETURN FALSE;
  END IF;
  
  -- Check file extension
  IF NOT (LOWER(file_extension) = ANY(allowed_extensions)) THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Insert default storage settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('petition_max_file_size_mb', '50', 'number', 'Ukuran maksimal file upload untuk aspirasi dalam MB', true),
('petition_allowed_file_types', '["jpg", "jpeg", "png", "gif", "webp", "mp4", "mov", "pdf", "doc", "docx"]', 'json', 'Tipe file yang diizinkan untuk upload aspirasi', true),
('petition_file_retention_days', '30', 'number', 'Berapa hari file aspirasi disimpan sebelum dihapus otomatis', false)
ON CONFLICT (setting_key) DO NOTHING;

-- 9. Buat view untuk monitoring storage usage
CREATE OR REPLACE VIEW petition_storage_usage AS
SELECT 
  'ktp' as file_type,
  COUNT(*) as file_count,
  SUM(COALESCE((o.metadata->>'size')::BIGINT, 0)) as total_size_bytes,
  AVG(COALESCE((o.metadata->>'size')::BIGINT, 0)) as avg_size_bytes
FROM petitions p
JOIN storage.objects o ON o.name = p.ktp_url
WHERE p.ktp_url IS NOT NULL

UNION ALL

SELECT 
  'evidence_photos' as file_type,
  COUNT(*) as file_count,
  SUM(COALESCE((o.metadata->>'size')::BIGINT, 0)) as total_size_bytes,
  AVG(COALESCE((o.metadata->>'size')::BIGINT, 0)) as avg_size_bytes
FROM petitions p
CROSS JOIN LATERAL unnest(p.evidence_photos) as photo_url
JOIN storage.objects o ON o.name = photo_url
WHERE p.evidence_photos IS NOT NULL

UNION ALL

SELECT 
  'evidence_videos' as file_type,
  COUNT(*) as file_count,
  SUM(COALESCE((o.metadata->>'size')::BIGINT, 0)) as total_size_bytes,
  AVG(COALESCE((o.metadata->>'size')::BIGINT, 0)) as avg_size_bytes
FROM petitions p
JOIN storage.objects o ON o.name = p.evidence_video_url
WHERE p.evidence_video_url IS NOT NULL

UNION ALL

SELECT 
  'documents' as file_type,
  COUNT(*) as file_count,
  SUM(COALESCE((o.metadata->>'size')::BIGINT, 0)) as total_size_bytes,
  AVG(COALESCE((o.metadata->>'size')::BIGINT, 0)) as avg_size_bytes
FROM petitions p
CROSS JOIN LATERAL unnest(p.documents_url) as doc_url
JOIN storage.objects o ON o.name = doc_url
WHERE p.documents_url IS NOT NULL;

-- 10. Buat function untuk get storage statistics
CREATE OR REPLACE FUNCTION get_petition_storage_stats()
RETURNS TABLE (
  total_files BIGINT,
  total_size_bytes BIGINT,
  total_size_mb NUMERIC,
  files_by_type JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_files,
    SUM(COALESCE((o.metadata->>'size')::BIGINT, 0)) as total_size_bytes,
    ROUND(SUM(COALESCE((o.metadata->>'size')::BIGINT, 0)) / 1024.0 / 1024.0, 2) as total_size_mb,
    jsonb_object_agg(
      COALESCE(o.metadata->>'mimetype', 'unknown'),
      COUNT(*)
    ) as files_by_type
  FROM storage.objects o
  WHERE o.bucket_id = 'petitions';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SETUP SELESAI!
-- =====================================================
-- 
-- Langkah selanjutnya:
-- 1. Pastikan bucket 'petitions' sudah dibuat di Storage
-- 2. Test upload file dari frontend
-- 3. Monitor storage usage dengan view petition_storage_usage
-- 4. Setup cleanup job untuk menghapus file lama
-- 
-- =====================================================
