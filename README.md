# MagangHub Attendance Reminder

Pengingat otomatis absensi harian **MagangHub Kemnaker** (`https://monev.maganghub.kemnaker.go.id/`) via **Email (Gmail SMTP)** yang berjalan otomatis setiap hari pukul **18:00 WIB** melalui GitHub Actions.

## Cara Kerja
1. Mengambil profil peserta dari `GET /api/v1/users/me` untuk mengecek status magang aktif, periode magang, dan `off_days` (mis. `SUNDAY`).
2. Jika hari ini hari kerja aktif (bukan `off_days` maupun `EXTRA_HOLIDAYS`), script mengecek `GET /api/v1/attendances` untuk tanggal hari ini (`Asia/Jakarta`).
3. Jika absensi hari ini **belum diisi**, script mengirim email pengingat beserta link langsung ke MagangHub.
4. Jika token/sesi MagangHub kedaluwarsa (`HTTP 401/403`), script tetap mengirim email peringatan supaya kamu bisa cek absen manual dan memperbarui secret.

## Persiapan

### 1. Ambil Token atau Cookie MagangHub
1. Buka `https://monev.maganghub.kemnaker.go.id/` di Chrome dan pastikan sudah login.
2. Buka **DevTools** (`F12`) → tab **Network** → reload halaman.
3. Klik request `me` (`https://monev-api.maganghub.kemnaker.go.id/api/v1/users/me`) → lihat bagian **Request Headers**:
   - Jika ada header `Authorization: Bearer eyJ...`, salin nilai tokennya (tanpa kata `Bearer `) untuk `MAGANGHUB_AUTH_TOKEN`.
   - Jika memakai `Cookie`, salin seluruh nilai header `Cookie` untuk `MAGANGHUB_COOKIE`.

### 2. Buat Gmail App Password
1. Aktifkan **2-Step Verification** di akun Google kamu.
2. Buka [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Buat App Password baru (misal beri nama `MagangHub Reminder`), lalu salin 16 karakter password-nya untuk `GMAIL_APP_PASSWORD`.

## Menjalankan Secara Lokal
```bash
cp .env.example .env
# Isi .env sesuai konfigurasi di atas

npm test    # Jalankan unit test
npm start   # Jalankan pengecekan absensi sekarang
```

## Deploy Otomatis di GitHub Actions (Gratis)
1. Push repository ini ke GitHub (disarankan **Private Repository**).
2. Buka **Settings → Secrets and variables → Actions → New repository secret**, lalu tambahkan:
   - `MAGANGHUB_AUTH_TOKEN` dan/atau `MAGANGHUB_COOKIE`
   - `GMAIL_USER` (alamat Gmail pengirim)
   - `GMAIL_APP_PASSWORD` (16 karakter App Password)
   - `REMINDER_TO_EMAIL` *(opsional, default sama dengan `GMAIL_USER`)*
   - `EXTRA_HOLIDAYS` *(opsional, mis. `2026-12-25,2027-01-01`)*
3. Untuk tes langsung tanpa menunggu jam 18:00 WIB, buka tab **Actions → MagangHub Attendance Reminder → Run workflow**.
