const DEFAULT_WEB_URL = 'https://monev.maganghub.kemnaker.go.id/';
const DEFAULT_TIMEZONE = 'Asia/Jakarta';
const DEFAULT_OFF_DAYS = 'SUNDAY';

export function loadConfig(env = process.env) {
  const gmailUser = (env.GMAIL_USER || '').trim();
  const gmailAppPassword = (env.GMAIL_APP_PASSWORD || '').trim();
  const toEmail = (env.REMINDER_TO_EMAIL || gmailUser).trim();
  const participantName = (env.PARTICIPANT_NAME || 'Peserta Magang').trim();
  const timeZone = (env.TIMEZONE || DEFAULT_TIMEZONE).trim();
  const webUrl = (env.MAGANGHUB_WEB_URL || DEFAULT_WEB_URL).trim();
  const internshipStartDate = (env.INTERNSHIP_START_DATE || '').trim();
  const internshipEndDate = (env.INTERNSHIP_END_DATE || '').trim();

  const offDays = (env.OFF_DAYS || DEFAULT_OFF_DAYS)
    .split(',')
    .map((day) => day.trim().toUpperCase())
    .filter(Boolean);

  const extraHolidays = (env.EXTRA_HOLIDAYS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!gmailUser || !gmailAppPassword) {
    throw new Error(
      'Konfigurasi Gmail belum lengkap: wajib isi GMAIL_USER dan GMAIL_APP_PASSWORD.'
    );
  }

  return {
    gmailUser,
    gmailAppPassword,
    toEmail,
    participantName,
    timeZone,
    webUrl,
    offDays,
    extraHolidays,
    internshipStartDate,
    internshipEndDate,
  };
}
