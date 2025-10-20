-- =====================================================
-- SPEAKUP! - VERIFY TITLE/PROFESSION DISPLAY
-- =====================================================
-- Script untuk memverifikasi dan memperbaiki tampilan title/profession di timeline

-- 1. Cek struktur tabel profiles
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('title', 'profession')
ORDER BY ordinal_position;

-- 2. Cek data title dan profession yang ada
SELECT 
  id,
  full_name,
  title,
  profession,
  CASE 
    WHEN title IS NOT NULL AND title != '' THEN 'HAS_TITLE'
    WHEN profession IS NOT NULL AND profession != '' THEN 'HAS_PROFESSION'
    ELSE 'NO_TITLE_PROFESSION'
  END as status
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Hitung statistik title/profession
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN title IS NOT NULL AND title != '' THEN 1 END) as users_with_title,
  COUNT(CASE WHEN profession IS NOT NULL AND profession != '' THEN 1 END) as users_with_profession,
  COUNT(CASE WHEN (title IS NOT NULL AND title != '') OR (profession IS NOT NULL AND profession != '') THEN 1 END) as users_with_either
FROM profiles;

-- 4. Cek apakah ada data yang tidak sinkron antara title dan profession
SELECT 
  id,
  full_name,
  title,
  profession,
  CASE 
    WHEN title != profession THEN 'MISMATCH'
    ELSE 'MATCH'
  END as sync_status
FROM profiles 
WHERE (title IS NOT NULL AND title != '') OR (profession IS NOT NULL AND profession != '')
ORDER BY created_at DESC
LIMIT 10;

-- 5. Sinkronkan title dan profession (jika ada yang tidak sinkron)
UPDATE profiles 
SET 
  profession = title,
  updated_at = NOW()
WHERE (title IS NOT NULL AND title != '') 
  AND (profession IS NULL OR profession = '' OR profession != title);

UPDATE profiles 
SET 
  title = profession,
  updated_at = NOW()
WHERE (profession IS NOT NULL AND profession != '') 
  AND (title IS NULL OR title = '' OR title != profession);

-- 6. Verifikasi setelah sinkronisasi
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN title IS NOT NULL AND title != '' THEN 1 END) as users_with_title,
  COUNT(CASE WHEN profession IS NOT NULL AND profession != '' THEN 1 END) as users_with_profession,
  COUNT(CASE WHEN title = profession THEN 1 END) as synchronized_users
FROM profiles;

-- 7. Test query yang digunakan di timeline
SELECT 
  id,
  full_name,
  title,
  profession,
  avatar_url,
  is_verified
FROM profiles 
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM posts 
  LIMIT 5
);

-- 8. Pesan konfirmasi
DO $$
BEGIN
  RAISE NOTICE 'Verifikasi title/profession selesai!';
  RAISE NOTICE 'Pastikan field title dan profession sudah sinkron';
  RAISE NOTICE 'Timeline akan menampilkan title yang sudah disetting di edit profile';
END $$;
