#!/usr/bin/env bash
set -euo pipefail

# Jalankan dari folder file ini berada (root proyek)
cd "$(dirname "$0")"

# Masuk ke folder ui sebagai document root
cd ui

# Jalankan server Python di port 8000
python3 -m http.server 8000 -d .

# Info
echo "Server berjalan di http://localhost:8000/desktop.html"
echo "Pastikan mengakses halaman hanya lewat URL di atas. Jika Anda membuka file HTML langsung (file://), Supabase bisa gagal."
echo "Tekan Ctrl+C untuk berhenti."


