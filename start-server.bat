@echo off
setlocal

REM Jalankan dari folder file ini berada (root proyek)
cd /d "%~dp0"

REM Masuk ke folder ui sebagai document root
cd ui

REM Jalankan server Python di port 8000
python -m http.server 8000 -d .

echo.
echo Server berjalan di http://localhost:8000/desktop.html
echo Pastikan mengakses halaman hanya lewat URL di atas. Jika Anda membuka file HTML langsung (protocol file://), Supabase bisa gagal.
echo Tekan Ctrl+C untuk berhenti.
pause >nul


