# Sistem Kompresi Otomatis - SpeakUp! Platform

## 📋 Overview

Sistem kompresi otomatis telah diimplementasikan untuk mengoptimalkan ukuran file foto dan video yang diupload ke platform SpeakUp!. Sistem ini akan secara otomatis mengkompres file sebelum diupload ke Supabase Storage, sehingga menghemat bandwidth dan storage space.

## 🚀 Fitur Utama

### ✅ Kompresi Gambar/Foto
- **Format yang didukung**: JPG, PNG, GIF, WebP
- **Kualitas default**: 80% (dapat dikonfigurasi)
- **Resolusi maksimal**: 1920x1080 (dapat dikonfigurasi)
- **Ukuran maksimal**: 5MB (dapat dikonfigurasi)
- **Mempertahankan aspect ratio**

### ✅ Kompresi Video
- **Format yang didukung**: MP4, AVI, MOV, WMV, WebM
- **Kualitas default**: 70% (dapat dikonfigurasi)
- **Resolusi maksimal**: 1280x720 (dapat dikonfigurasi)
- **Ukuran maksimal**: 10MB (dapat dikonfigurasi)
- **Menggunakan WebM codec untuk kompresi optimal**

### ✅ Fallback System
- Jika kompresi gagal, sistem akan menggunakan file asli
- Logging yang detail untuk debugging
- Error handling yang robust

## 📁 File yang Diimplementasikan

### 1. `ui/assets/js/compression-utils.js`
**Class utama untuk kompresi file**
```javascript
// Contoh penggunaan
const compressedFile = await window.compressionUtils.compressImage(file, {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    maxSize: 5 * 1024 * 1024
});
```

### 2. `ui/assets/js/app.js` (Updated)
**Handler upload untuk postingan timeline**
- Kompresi otomatis untuk gambar dan video
- Logging kompresi untuk monitoring
- Fallback ke file asli jika kompresi gagal

### 3. `ui/config/petitions-api.js` (Updated)
**Handler upload untuk sistem petisi**
- Kompresi otomatis untuk semua file upload
- Konfigurasi berbeda untuk gambar dan video
- Integrasi dengan sistem petisi yang ada

### 4. `ui/compression-test.html`
**Halaman testing untuk kompresi**
- Interface untuk testing kompresi
- Drag & drop file upload
- Statistik kompresi real-time
- Preview hasil kompresi

## ⚙️ Konfigurasi

### Default Settings
```javascript
// Gambar
{
    quality: 0.8,           // 80% kualitas
    maxWidth: 1920,         // Max lebar 1920px
    maxHeight: 1080,        // Max tinggi 1080px
    maxSize: 5 * 1024 * 1024 // Max 5MB
}

// Video
{
    quality: 0.7,           // 70% kualitas
    maxWidth: 1280,         // Max lebar 1280px
    maxHeight: 720,          // Max tinggi 720px
    maxSize: 10 * 1024 * 1024 // Max 10MB
}
```

### Custom Configuration
```javascript
// Update konfigurasi global
window.compressionUtils.updateConfig({
    imageQuality: 0.9,      // 90% kualitas untuk gambar
    videoQuality: 0.8,       // 80% kualitas untuk video
    maxImageWidth: 2560,    // Max lebar gambar 2560px
    maxImageHeight: 1440,    // Max tinggi gambar 1440px
    maxVideoWidth: 1920,     // Max lebar video 1920px
    maxVideoHeight: 1080,    // Max tinggi video 1080px
    maxFileSize: 20 * 1024 * 1024 // Max 20MB
});
```

## 🔧 Implementasi

### 1. Include Script
Tambahkan script compression-utils.js sebelum app.js:
```html
<script src="assets/js/compression-utils.js"></script>
<script src="assets/js/app.js"></script>
```

### 2. Automatic Compression
Kompresi akan berjalan otomatis pada:
- Upload gambar/video di timeline posting
- Upload file di sistem petisi (KTP, evidence, dokumen)
- Semua upload file melalui PetitionsAPI

### 3. Manual Compression
```javascript
// Kompresi gambar
const compressedImage = await window.compressionUtils.compressImage(file, options);

// Kompresi video
const compressedVideo = await window.compressionUtils.compressVideo(file, options);

// Kompresi berdasarkan tipe file
const compressedFile = await window.compressionUtils.compressFile(file, options);

// Kompresi multiple files
const compressedFiles = await window.compressionUtils.compressFiles(fileList, options);
```

## 📊 Monitoring & Logging

### Console Logs
Sistem akan menampilkan log detail di console:
```
Starting image compression for: photo.jpg, size: 8MB
Compressing image...
Image compressed: 8388608 -> 2097152 bytes (75% reduction)
Image uploaded successfully: https://...
```

### Error Handling
```javascript
try {
    const compressed = await window.compressionUtils.compressFile(file);
} catch (error) {
    console.warn('Compression failed, using original file:', error);
    // File asli akan digunakan sebagai fallback
}
```

## 🧪 Testing

### Test Page
Akses `ui/compression-test.html` untuk testing:
- Upload berbagai format file
- Lihat statistik kompresi
- Download hasil kompresi
- Preview hasil kompresi

### Test Scenarios
1. **Gambar besar** (>5MB) → Dikompres ke <5MB
2. **Video besar** (>10MB) → Dikompres ke <10MB
3. **File kecil** (<50% max size) → Tidak dikompres
4. **Format tidak didukung** → Fallback ke file asli
5. **Error kompresi** → Fallback ke file asli

## 🚨 Troubleshooting

### Common Issues

#### 1. CompressionUtils tidak tersedia
```javascript
// Pastikan script dimuat sebelum digunakan
if (window.compressionUtils) {
    // Gunakan compression utils
} else {
    console.warn('CompressionUtils not available');
}
```

#### 2. Kompresi gagal
- Cek format file yang didukung
- Pastikan file tidak rusak
- Cek ukuran file (terlalu besar mungkin gagal)

#### 3. Kualitas hasil buruk
- Adjust quality setting
- Periksa resolusi asli vs target
- Coba dengan kualitas lebih tinggi

### Debug Mode
```javascript
// Enable debug logging
window.compressionUtils.updateConfig({
    debug: true
});
```

## 📈 Performance Impact

### Benefits
- **Bandwidth savings**: 50-80% pengurangan ukuran file
- **Storage savings**: Menghemat space di Supabase Storage
- **Faster uploads**: File lebih kecil = upload lebih cepat
- **Better UX**: Loading time lebih cepat

### Considerations
- **Processing time**: Kompresi membutuhkan waktu (1-5 detik)
- **Browser compatibility**: Menggunakan Canvas API dan MediaRecorder
- **Memory usage**: File besar membutuhkan memory lebih

## 🔄 Future Enhancements

### Planned Features
1. **Progressive compression**: Multiple quality levels
2. **WebP conversion**: Convert semua gambar ke WebP
3. **Lazy compression**: Kompresi di background
4. **Batch processing**: Kompresi multiple files sekaligus
5. **Custom presets**: Preset kompresi untuk use case berbeda

### Advanced Configuration
```javascript
// Preset untuk postingan timeline
const timelinePreset = {
    imageQuality: 0.8,
    maxImageSize: 2 * 1024 * 1024, // 2MB
    videoQuality: 0.7,
    maxVideoSize: 5 * 1024 * 1024   // 5MB
};

// Preset untuk petisi (dokumen penting)
const petitionPreset = {
    imageQuality: 0.9,
    maxImageSize: 5 * 1024 * 1024,  // 5MB
    videoQuality: 0.8,
    maxVideoSize: 10 * 1024 * 1024 // 10MB
};
```

## 📝 Changelog

### v1.0.0 (Current)
- ✅ Implementasi kompresi gambar dengan Canvas API
- ✅ Implementasi kompresi video dengan MediaRecorder API
- ✅ Integrasi dengan sistem upload yang ada
- ✅ Fallback system untuk error handling
- ✅ Testing interface
- ✅ Dokumentasi lengkap

---

**Sistem kompresi otomatis telah berhasil diimplementasikan dan siap digunakan! 🎉**

Untuk testing, akses `ui/compression-test.html` atau langsung upload file di platform untuk melihat kompresi otomatis bekerja.

