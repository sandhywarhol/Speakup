SpeakUp! - Dokumentasi

Struktur berkas dokumentasi:

- docs/postman/SpeakUp.postman_collection.json
- docs/postman/SpeakUp-Dev.postman_environment.json
- docs/wireframes/wireframe.md
- docs/policies/sop-moderator.md

Gunakan berkas Postman untuk uji API, wireframe untuk acuan UI, dan SOP moderator untuk operasional tim review.


Konfigurasi Lokal (Stabil di Semua Komputer)
------------------------------------------------

- Jalankan server dari folder `ui` sebagai document root:
  1) PowerShell: `cd C:\Users\Baraka\Documents\SpeakUp!`
  2) `python -m http.server 8000 -d ui`
  3) Buka: `http://localhost:8000/desktop.html`

- Start cepat (one-click):
  - Windows: double-click `start-server.bat`
  - Linux/Mac: `chmod +x start-server.sh && ./start-server.sh`

- Supabase (di Dashboard):
  - Site URL: `http://localhost:8000`
  - Redirect URLs: `http://localhost:8000/oauth-callback.html`
  - Provider Redirect URLs (Google/GitHub/dst): `http://localhost:8000/oauth-callback.html`

- Frontend Auth:
  - Semua `redirectTo` mengarah ke `/oauth-callback.html`
  - Setelah sukses login di callback, diarahkan manual ke `desktop.html`

- Uji cepat koneksi:
  - Di Console browser: `window.getSupabase()?.auth.getSession().then(console.log)`


