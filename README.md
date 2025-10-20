# SpeakUp! - Platform Petisi Online

SpeakUp! adalah platform revolusioner yang memberikan ruang aman untuk berbagi pengalaman bullying, kekerasan, atau ketidakadilan. Dapatkan dukungan, solusi, dan kekuatan untuk perubahan tanpa mengorbankan privasi Anda.

## Fitur Utama

- **Anonimitas Fleksibel** - Pilih tingkat privasi sesuai kenyamanan Anda
- **Moderasi Cerdas** - Konten aman dan terpantau 24/7
- **Komunitas Supportif** - Dukungan dari sesama pengguna yang memahami
- **Aksi Nyata** - Ubah cerita menjadi aspirasi dan perubahan positif

## Teknologi

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Supabase (Database & Authentication)
- **Deployment**: Vercel
- **Database**: PostgreSQL (via Supabase)

## Struktur Proyek

```
SpeakUp!/
├── ui/                          # Folder utama aplikasi
│   ├── desktop.html             # Halaman utama
│   ├── petitions-desktop.html   # Halaman petisi
│   ├── create-petition-desktop.html
│   ├── profile-desktop.html
│   ├── settings-desktop.html
│   ├── timeline-desktop.html
│   ├── sign-desktop.html
│   ├── assets/                  # CSS, JS, gambar
│   └── config/                  # Konfigurasi Supabase
├── docs/                        # Dokumentasi
├── *.sql                        # File database schema
└── vercel.json                  # Konfigurasi deployment
```

## Cara Menjalankan

### Lokal Development

1. Clone repository ini
2. Masuk ke folder proyek
3. Jalankan server lokal:
   ```bash
   # Windows
   .\start-server.bat
   
   # Linux/Mac
   ./start-server.sh
   ```
4. Buka browser dan akses: http://localhost:8000/ui/desktop.html

### Production

Aplikasi sudah di-deploy di Vercel dan dapat diakses melalui URL yang diberikan.

## Database Setup

Jalankan file SQL berikut untuk setup database:

1. `create-petitions-database-schema.sql` - Schema utama
2. `create-settings-database-schema.sql` - Schema settings
3. `create-admin-user-complete.sql` - Setup admin user
4. `enable-realtime.sql` - Enable realtime features

## Kontribusi

1. Fork repository ini
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## Kontak

- **Email**: rangga@obeliskprotocol.io
- **Phone**: +6282193333831
- **Location**: Yogyakarta, Indonesia

## Link Terkait

- [Komnas HAM](https://www.komnasham.go.id)
- [KPAI](https://www.kpai.go.id)
- [Komnas Perempuan](https://www.komnasperempuan.go.id)
- [KemenPPPA](https://www.kemenpppa.go.id)
- [UNICEF Indonesia](https://www.unicef.org/indonesia)
- [Save the Children](https://www.savethechildren.or.id)
- [Yayasan Pulih](https://www.yayasanpulih.org)
- [Rumah Aman](https://www.rumahaman.org)
