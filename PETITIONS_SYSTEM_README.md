# Sistem Aspirasi/Petisi SpeakUp!

## 📋 Overview

Sistem aspirasi/petisi SpeakUp! memungkinkan pengguna untuk membuat aspirasi yang akan dimoderasi oleh admin sebelum dipublikasikan ke publik. Sistem ini dirancang untuk memastikan kualitas dan keamanan konten aspirasi.

## 🏗️ Arsitektur Sistem

### Database Schema

Sistem menggunakan 6 tabel utama:

1. **`petitions`** - Tabel utama aspirasi
2. **`petition_signatures`** - Tanda tangan aspirasi
3. **`petition_supporters`** - Dukungan aspirasi
4. **`petition_comments`** - Komentar aspirasi
5. **`petition_notifications`** - Notifikasi terkait aspirasi
6. **`petition_moderation_log`** - Log moderasi admin

### Status Aspirasi

- **`pending`** - Menunggu review admin
- **`approved`** - Disetujui admin, siap dipublikasikan
- **`rejected`** - Ditolak admin
- **`published`** - Sudah dipublikasikan ke publik

## 🚀 Setup dan Instalasi

### 1. Database Setup

Jalankan script SQL berikut di Supabase SQL Editor:

```sql
-- Jalankan file: create-petitions-database-schema.sql
```

### 2. Storage Setup

Buat bucket storage di Supabase dengan nama `petitions` untuk menyimpan file upload.

### 3. Admin Setup

Pastikan ada user dengan role `admin` di tabel `profiles`:

```sql
UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';
```

## 📁 File Structure

```
ui/
├── config/
│   └── petitions-api.js          # API client untuk aspirasi
├── create-petition-desktop.html  # Form buat aspirasi
├── petitions-desktop.html        # Halaman daftar aspirasi
├── admin-petitions-desktop.html  # Panel admin moderasi
└── ...

Database Scripts:
├── create-petitions-database-schema.sql  # Schema database
└── PETITIONS_SYSTEM_README.md           # Dokumentasi ini
```

## 🔧 Fitur Utama

### 1. Pembuatan Aspirasi
- Form lengkap dengan validasi
- Upload file pendukung (KTP, bukti, dokumen)
- Tanda tangan digital
- Verifikasi identitas

### 2. Sistem Moderasi
- Admin dapat review, approve, reject, atau publish aspirasi
- Log moderasi lengkap
- Notifikasi otomatis ke pembuat aspirasi

### 3. Tampilan Publik
- Hanya aspirasi dengan status `published` yang ditampilkan
- Filter berdasarkan kategori
- Progress bar tanda tangan
- Sistem dukungan dan komentar

### 4. Tanda Tangan Digital
- Canvas untuk menggambar tanda tangan
- Simpan tanda tangan sebagai base64
- Validasi tanda tangan wajib

## 🎯 API Functions

### PetitionsAPI Class

```javascript
// Membuat aspirasi baru
await window.petitionsAPI.createPetition(petitionData);

// Mengambil aspirasi yang dipublikasikan
await window.petitionsAPI.getPublishedPetitions(options);

// Mengambil detail aspirasi
await window.petitionsAPI.getPetitionDetails(petitionId);

// Menandatangani aspirasi
await window.petitionsAPI.signPetition(petitionId, signatureData);

// Mendukung aspirasi
await window.petitionsAPI.supportPetition(petitionId);
```

### Database Functions

```sql
-- Mendapatkan aspirasi yang dipublikasikan
SELECT * FROM get_published_petitions(category, limit, offset);

-- Mendapatkan detail aspirasi
SELECT * FROM get_petition_details(petition_id);

-- Menandatangani aspirasi
SELECT sign_petition(petition_id, full_name, email, phone, signature_data, is_anonymous);

-- Moderasi aspirasi (admin only)
SELECT moderate_petition(petition_id, action, notes);
```

## 🔐 Keamanan

### Row Level Security (RLS)
- Semua tabel menggunakan RLS
- User hanya bisa melihat aspirasi yang dipublikasikan
- Admin memiliki akses penuh untuk moderasi
- User hanya bisa mengedit aspirasi mereka sendiri yang masih pending

### Validasi Data
- Validasi NIK (16 digit)
- Validasi email format
- Validasi nomor telepon
- Validasi ukuran file upload
- Validasi tipe file yang diizinkan

## 📱 User Flow

### 1. Pembuatan Aspirasi
1. User mengisi form aspirasi
2. Upload file pendukung (KTP wajib)
3. Buat tanda tangan digital
4. Submit untuk review admin
5. Status: `pending`

### 2. Moderasi Admin
1. Admin review aspirasi di panel admin
2. Admin dapat approve/reject dengan catatan
3. Jika approve, status: `approved`
4. Admin dapat publish, status: `published`
5. Notifikasi otomatis ke pembuat

### 3. Tampilan Publik
1. Hanya aspirasi `published` yang ditampilkan
2. User dapat menandatangani dan mendukung
3. Progress bar menunjukkan kemajuan
4. Sistem komentar tersedia

## 🎨 UI/UX Features

### Form Pembuatan Aspirasi
- Multi-step form dengan validasi real-time
- Upload preview untuk semua file
- Canvas tanda tangan digital
- Progress indicator

### Halaman Aspirasi
- Card layout dengan progress bar
- Filter berdasarkan kategori
- Infinite scroll loading
- Responsive design

### Panel Admin
- Dashboard dengan statistik
- Filter berdasarkan status
- Modal detail aspirasi
- Action buttons untuk moderasi

## 🔄 Notifikasi System

Sistem notifikasi otomatis untuk:
- Status perubahan aspirasi
- Tanda tangan baru
- Komentar baru
- Dukungan baru

## 📊 Analytics & Monitoring

### Statistik Admin
- Jumlah aspirasi per status
- Aspirasi pending yang perlu review
- Aktivitas moderasi

### Logging
- Log semua aksi moderasi
- Audit trail lengkap
- IP address dan user agent tracking

## 🚨 Troubleshooting

### Common Issues

1. **File upload gagal**
   - Pastikan bucket `petitions` sudah dibuat
   - Check file size limit
   - Verify file type allowed

2. **Admin tidak bisa akses panel**
   - Pastikan user memiliki role `admin`
   - Check RLS policies
   - Verify authentication

3. **Aspirasi tidak muncul**
   - Check status aspirasi (harus `published`)
   - Verify RLS policies
   - Check database connection

### Debug Mode

Aktifkan console logging untuk debugging:
```javascript
// Di browser console
localStorage.setItem('debug_petitions', 'true');
```

## 🔮 Future Enhancements

### Planned Features
- [ ] Email notifications
- [ ] Push notifications
- [ ] Advanced search dan filter
- [ ] Export data aspirasi
- [ ] Analytics dashboard
- [ ] Mobile app integration
- [ ] Social media sharing
- [ ] QR code untuk signature

### Performance Optimizations
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Caching strategy
- [ ] CDN integration

## 📞 Support

Untuk pertanyaan atau masalah teknis:
1. Check dokumentasi ini
2. Review console logs
3. Check database logs di Supabase
4. Contact development team

---

**Versi:** 1.0.0  
**Terakhir Update:** Desember 2024  
**Maintainer:** SpeakUp! Development Team
