# 🚀 Instruksi Setup Sistem Aspirasi SpeakUp!

## 📋 Prerequisites

Sebelum memulai setup, pastikan:
- [ ] Supabase project sudah dibuat
- [ ] Database connection sudah dikonfigurasi
- [ ] User sudah bisa login/register
- [ ] Tabel `profiles` sudah ada

## 🔧 Setup Database

### 1. Jalankan Schema Database

Buka Supabase SQL Editor dan jalankan script berikut **berurutan**:

```sql
-- 1. Schema utama untuk aspirasi
-- File: create-petitions-database-schema.sql
```

### 2. Setup Storage

```sql
-- 2. Setup storage untuk file upload
-- File: setup-petitions-storage.sql
```

### 3. Buat User Admin

```sql
-- 3. Buat user admin
-- File: create-admin-user.sql
-- Ganti 'user-uuid-here' dengan UUID user yang ingin dijadikan admin
```

## 📁 Setup File Frontend

### 1. Pastikan File API Sudah Ada

File berikut harus sudah ada di folder `ui/config/`:
- [x] `petitions-api.js` ✅ (sudah dibuat)
- [x] `supabase-config.js` ✅ (sudah ada)
- [x] `supabase-bootstrap.js` ✅ (sudah ada)

### 2. Update HTML Files

File berikut sudah diupdate:
- [x] `create-petition-desktop.html` ✅ (sudah diintegrasikan)
- [x] `petitions-desktop.html` ✅ (sudah diupdate)
- [x] `admin-petitions-desktop.html` ✅ (sudah dibuat)

## 🔐 Setup Admin User

### Cara 1: Via SQL (Recommended)

1. Buka Supabase SQL Editor
2. Jalankan script `create-admin-user.sql`
3. Ganti `'user-uuid-here'` dengan UUID user yang ingin dijadikan admin
4. Jalankan script

### Cara 2: Via Supabase Dashboard

1. Buka Supabase Dashboard
2. Pergi ke Table Editor > profiles
3. Cari user yang ingin dijadikan admin
4. Edit row tersebut
5. Set `role = 'admin'` dan `is_verified = true`

## 🧪 Testing

### 1. Test Pembuatan Aspirasi

1. Login sebagai user biasa
2. Buka `create-petition-desktop.html`
3. Isi form aspirasi lengkap
4. Upload file KTP
5. Buat tanda tangan digital
6. Submit aspirasi
7. Cek status di database (harus `pending`)

### 2. Test Moderasi Admin

1. Login sebagai admin
2. Buka `admin-petitions-desktop.html`
3. Cek apakah ada aspirasi pending
4. Review dan approve/reject aspirasi
5. Test publish aspirasi

### 3. Test Tampilan Publik

1. Buka `petitions-desktop.html`
2. Cek apakah aspirasi yang sudah dipublish muncul
3. Test filter berdasarkan kategori
4. Test tanda tangan dan dukungan

## 🔍 Troubleshooting

### Error: "Supabase client not available"

**Solusi:**
1. Pastikan `supabase-config.js` sudah dimuat
2. Check console untuk error loading
3. Pastikan Supabase URL dan key benar

### Error: "Only admins can moderate petitions"

**Solusi:**
1. Pastikan user sudah memiliki role `admin`
2. Check tabel `profiles` untuk field `role`
3. Reload halaman setelah update role

### Error: "File upload failed"

**Solusi:**
1. Pastikan bucket `petitions` sudah dibuat di Storage
2. Check file size limit (50MB)
3. Check file type yang diizinkan
4. Pastikan RLS policies sudah benar

### Aspirasi tidak muncul di halaman publik

**Solusi:**
1. Check status aspirasi (harus `published`)
2. Check RLS policies untuk tabel `petitions`
3. Pastikan function `get_published_petitions` berjalan

### Form aspirasi tidak bisa submit

**Solusi:**
1. Check validasi form (semua field wajib)
2. Pastikan tanda tangan digital sudah dibuat
3. Check console untuk error JavaScript
4. Pastikan file KTP sudah diupload

## 📊 Monitoring

### 1. Database Monitoring

```sql
-- Cek jumlah aspirasi per status
SELECT status, COUNT(*) FROM petitions GROUP BY status;

-- Cek aktivitas admin
SELECT * FROM get_admin_activity_log(10);

-- Cek storage usage
SELECT * FROM petition_storage_usage;
```

### 2. Storage Monitoring

1. Buka Supabase Dashboard > Storage
2. Check bucket `petitions`
3. Monitor file size dan jumlah file
4. Setup cleanup job jika diperlukan

## 🔄 Maintenance

### 1. Cleanup File Lama

```sql
-- Jalankan cleanup file yang tidak terpakai
SELECT cleanup_old_petition_files();
```

### 2. Backup Database

1. Buka Supabase Dashboard
2. Pergi ke Settings > Database
3. Download backup database
4. Simpan backup secara berkala

### 3. Update Admin List

```sql
-- Lihat daftar admin
SELECT * FROM get_admin_list();

-- Promote user baru ke admin
SELECT promote_to_admin('new-user-uuid');
```

## 🚀 Deployment

### 1. Production Checklist

- [ ] Database schema sudah dijalankan
- [ ] Storage bucket sudah dibuat
- [ ] Admin user sudah dibuat
- [ ] RLS policies sudah aktif
- [ ] File upload sudah ditest
- [ ] Moderasi sudah ditest
- [ ] Tampilan publik sudah ditest

### 2. Performance Optimization

- [ ] Setup database indexes
- [ ] Enable connection pooling
- [ ] Setup CDN untuk file upload
- [ ] Monitor query performance

### 3. Security Checklist

- [ ] RLS policies sudah benar
- [ ] File upload validation aktif
- [ ] Admin access sudah dibatasi
- [ ] Input validation sudah lengkap

## 📞 Support

Jika mengalami masalah:

1. **Check Console Logs** - Buka browser console untuk error
2. **Check Database Logs** - Lihat Supabase logs
3. **Check Network Tab** - Lihat request/response API
4. **Review Documentation** - Baca `PETITIONS_SYSTEM_README.md`

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| File upload gagal | Check storage bucket dan policies |
| Admin tidak bisa akses | Check role di tabel profiles |
| Aspirasi tidak muncul | Check status dan RLS policies |
| Form tidak submit | Check validasi dan console error |

---

**Setup selesai!** 🎉

Sistem aspirasi SpeakUp! sudah siap digunakan. Pastikan semua testing sudah dilakukan sebelum production deployment.
