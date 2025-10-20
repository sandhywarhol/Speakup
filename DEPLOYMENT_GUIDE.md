# 🚀 Panduan Deployment SpeakUp! ke Vercel

## ✅ Status Setup
- [x] Repository GitHub sudah ter-sync
- [x] File konfigurasi sudah diupdate
- [x] .gitignore dan .vercelignore sudah dibuat

## 🔧 Langkah-langkah Deployment ke Vercel

### 1. Login ke Vercel
1. Buka [vercel.com](https://vercel.com)
2. Login dengan akun GitHub Anda
3. Klik "New Project"

### 2. Import Repository
1. Pilih repository `sandhywarhol/Speakup`
2. Klik "Import"

### 3. Konfigurasi Project
- **Project Name**: `speakup-platform` (atau sesuai keinginan)
- **Framework Preset**: `Other` (karena ini static site)
- **Root Directory**: `./` (biarkan default)
- **Build Command**: `echo "No build required"`
- **Output Directory**: `ui` (PENTING!)

### 4. Environment Variables (jika diperlukan)
Jika ada environment variables untuk Supabase:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### 5. Deploy
1. Klik "Deploy"
2. Tunggu proses deployment selesai
3. Vercel akan memberikan URL seperti: `https://speakup-platform.vercel.app`

## 🔗 URL Routing
Setelah deployment, URL berikut akan tersedia:
- `https://your-domain.vercel.app/` → Halaman utama
- `https://your-domain.vercel.app/petitions` → Halaman petisi
- `https://your-domain.vercel.app/create-petition` → Buat petisi
- `https://your-domain.vercel.app/profile` → Profil user
- `https://your-domain.vercel.app/admin/petitions` → Panel admin

## 🛠️ Troubleshooting

### Error: "Build failed"
**Solusi:**
1. Pastikan Root Directory di-set ke `./` (bukan `ui`)
2. Pastikan Output Directory di-set ke `ui`
3. Check file `.vercelignore` sudah benar

### Error: "404 Not Found"
**Solusi:**
1. Pastikan `vercel.json` sudah ter-push ke GitHub
2. Check routing configuration di `vercel.json`
3. Pastikan file HTML ada di folder `ui/`

### Error: "Supabase connection failed"
**Solusi:**
1. Check environment variables di Vercel dashboard
2. Pastikan Supabase URL dan key benar
3. Check file `ui/config/supabase-config.js`

## 📱 Custom Domain (Opsional)
1. Di Vercel dashboard, pilih project
2. Pergi ke Settings > Domains
3. Add custom domain
4. Follow instruksi DNS setup

## 🔄 Auto-Deploy
Setiap kali Anda push ke branch `main` di GitHub, Vercel akan otomatis deploy ulang.

## 📊 Monitoring
- Vercel dashboard menampilkan analytics
- Check logs jika ada error
- Monitor performance di dashboard

---
**Deployment selesai!** 🎉

Aplikasi SpeakUp! Anda sekarang live di internet dan bisa diakses dari mana saja!
