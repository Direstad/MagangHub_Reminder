const DEFAULT_API_BASE = 'https://monev-api.maganghub.kemnaker.go.id/api/v1';
const DEFAULT_WEB_URL = 'https://monev.maganghub.kemnaker.go.id/';
const DEFAULT_TIMEZONE = 'Asia/Jakarta';

export function loadConfig(env = process.env) {
  const authToken = (env.MAGANGHUB_AUTH_TOKEN || '').trim();
  const cookie = (env.MAGANGHUB_COOKIE || '').trim();
  const gmailUser = (env.GMAIL_USER || '').trim();
  const gmailAppPassword = (env.GMAIL_APP_PASSWORD || '').trim();
  const toEmail = (env.REMINDER_TO_EMAIL || gmailUser).trim();
  const timeZone = (env.TIMEZONE || DEFAULT_TIMEZONE).trim();
  const apiBase = (env.MAGANGHUB_API_BASE || DEFAULT_API_BASE).trim().replace(/\/+$/, '');
  const webUrl = (env.MAGANGHUB_WEB_URL || DEFAULT_WEB_URL).trim();

  const extraHolidays = (env.EXTRA_HOLIDAYS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!authToken && !cookie) {
    throw new Error(
      'Konfigurasi autentikasi kosong: isi minimal MAGANGHUB_AUTH_TOKEN atau MAGANGHUB_COOKIE.'
    );
  }

  if (!gmailUser || !gmailAppPassword) {
    throw new Error(
      'Konfigurasi Gmail belum lengkap: wajib isi GMAIL_USER dan GMAIL_APP_PASSWORD.'
    );
  }

  return {
    authToken,
    cookie,
    gmailUser,
    gmailAppPassword,
    toEmail,
    timeZone,
    apiBase,
    webUrl,
    extraHolidays,
  };
}
