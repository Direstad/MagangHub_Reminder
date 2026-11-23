# MagangHub Attendance Reminder

Pengingat otomatis absensi harian **MagangHub Kemnaker** (`https://monev.maganghub.kemnaker.go.id/`) via **Email (Gmail SMTP)** yang berjalan setiap hari kerja pukul **18:00 WIB** melalui GitHub Actions.

## Cara Kerja
- Berjalan otomatis setiap hari pukul **18:00 WIB** (`0 11 * * *` UTC) via GitHub Actions.
- Otomatis **melewati hari libur** (`OFF_DAYS`, default `SUNDAY`), tanggal merah tambahan (`EXTRA_HOLIDAYS`), dan tanggal di luar periode magang (`2026-08-10` s/d `2027-02-09`).
- Tidak bergantung pada token/cookie sesi MagangHub (yang dibatasi TTL 6 jam & proteksi Cloudflare), sehingga berjalan stabil tanpa perlu refresh token berkala.

## Persiapan: Buat Gmail App Password
1. Aktifkan **2-Step Verification** di [Google Account Security](https://myaccount.google.com/security).
2. Buka [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Buat App Password baru (misal beri nama `MagangHub Reminder`), lalu salin 16 karakter password-nya untuk `GMAIL_APP_PASSWORD`.

## Menjalankan Secara Lokal
```bash
cp .env.example .env
# Isi GMAIL_USER dan GMAIL_APP_PASSWORD di .env

npm test    # Jalankan unit test
npm start   # Kirim pengingat sekarang (jika hari ini hari kerja aktif)
```

## Deploy Otomatis di GitHub Actions (Gratis)
1. Push repository ini ke branch default (`main`) di GitHub.
2. Buka **Settings → Secrets and variables → Actions → New repository secret**, lalu tambahkan:
   - `GMAIL_USER` (alamat Gmail pengirim)
   - `GMAIL_APP_PASSWORD` (16 karakter App Password)
   - `REMINDER_TO_EMAIL` *(opsional, default sama dengan `GMAIL_USER`)*
   - `PARTICIPANT_NAME` *(opsional, default `Peserta Magang`)*
   - `OFF_DAYS` *(opsional, default `SUNDAY`)*
   - `EXTRA_HOLIDAYS` *(opsional, mis. `2026-12-25,2027-01-01`)*
3. Untuk tes langsung tanpa menunggu jam 18:00 WIB, buka tab **Actions → MagangHub Attendance Reminder → Run workflow**.
