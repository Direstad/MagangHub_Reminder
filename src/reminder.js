import { getDateContext, isWithinDateRange } from './date.js';
import { AuthExpiredError } from './maganghub.js';

function checkEligibility({ user, dateContext, extraHolidays = [], timeZone = 'Asia/Jakarta' }) {
  if (!user?.participant_status?.active_internship) {
    return { eligible: false, reason: 'inactive_internship' };
  }

  if (
    !isWithinDateRange(
      dateContext.dateStr,
      user.internship_start_date,
      user.internship_end_date,
      timeZone
    )
  ) {
    return { eligible: false, reason: 'outside_internship_period' };
  }

  const offDays = (user.off_days || []).map((day) => String(day).toUpperCase());
  if (offDays.includes(dateContext.dayName)) {
    return { eligible: false, reason: 'off_day' };
  }

  if (extraHolidays.includes(dateContext.dateStr)) {
    return { eligible: false, reason: 'extra_holiday' };
  }

  return { eligible: true, reason: null };
}

export function buildReminderEmail({ user, dateContext, webUrl }) {
  const name = user?.name || 'Peserta Magang';
  const company = user?.internship_company || 'MagangHub';

  const subject = `[MagangHub] Pengingat: Belum Absen Hari Ini (${dateContext.dateStr})`;

  const text = [
    `Halo ${name},`,
    '',
    `Absensi harian MagangHub untuk tanggal ${dateContext.dateStr} (${company}) terdeteksi BELUM DIISI.`,
    '',
    `Segera isi absensi & laporan harianmu di: ${webUrl}`,
    '',
    'Email ini dikirim otomatis oleh MagangHub Attendance Reminder.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #b91c1c; margin-bottom: 8px;">Pengingat Absensi MagangHub</h2>
      <p>Halo <strong>${name}</strong>,</p>
      <p>
        Absensi harian MagangHub untuk tanggal <strong>${dateContext.dateStr}</strong>
        (${company}) terdeteksi <strong>BELUM DIISI</strong>.
      </p>
      <p style="margin: 20px 0;">
        <a href="${webUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Buka MagangHub &amp; Isi Absen
        </a>
      </p>
      <p style="font-size: 12px; color: #6b7280;">
        Link langsung: <a href="${webUrl}">${webUrl}</a>
      </p>
    </div>
  `.trim();

  return { subject, text, html };
}

export function buildAuthExpiredEmail({ dateStr, webUrl }) {
  const subject = `[MagangHub] Token/Sesi Kedaluwarsa (${dateStr}) - Cek Absen Manual`;

  const text = [
    'Halo,',
    '',
    `Pengecekan otomatis absensi MagangHub untuk tanggal ${dateStr} gagal karena token/sesi autentikasi sudah kedaluwarsa (HTTP 401/403).`,
    '',
    'Tindakan yang perlu dilakukan:',
    `1. Cek manual apakah absen hari ini sudah diisi di: ${webUrl}`,
    '2. Perbarui secret MAGANGHUB_AUTH_TOKEN atau MAGANGHUB_COOKIE di GitHub Secrets / .env lokal.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #d97706; margin-bottom: 8px;">Sesi MagangHub Kedaluwarsa</h2>
      <p>
        Pengecekan otomatis absensi untuk tanggal <strong>${dateStr}</strong> gagal karena
        token/sesi autentikasi sudah kedaluwarsa (HTTP 401/403).
      </p>
      <ol>
        <li>Cek manual absensi hari ini di <a href="${webUrl}">${webUrl}</a>.</li>
        <li>Perbarui secret <code>MAGANGHUB_AUTH_TOKEN</code> atau <code>MAGANGHUB_COOKIE</code> di GitHub Secrets / <code>.env</code> lokal.</li>
      </ol>
    </div>
  `.trim();

  return { subject, text, html };
}

export function evaluateAttendance({
  user,
  attendances,
  dateContext,
  extraHolidays = [],
  webUrl,
  timeZone = 'Asia/Jakarta',
}) {
  const eligibility = checkEligibility({ user, dateContext, extraHolidays, timeZone });
  if (!eligibility.eligible) {
    return { shouldNotify: false, reason: eligibility.reason };
  }

  const hasSubmittedToday = (attendances || []).some((item) => item?.date === dateContext.dateStr);
  if (hasSubmittedToday) {
    return { shouldNotify: false, reason: 'already_submitted' };
  }

  return {
    shouldNotify: true,
    reason: 'missing_attendance',
    email: buildReminderEmail({ user, dateContext, webUrl }),
  };
}

export async function runReminderCheck({ client, notifier, config, now = new Date() }) {
  const dateContext = getDateContext(now, config.timeZone);

  try {
    const user = await client.getMe();
    const eligibility = checkEligibility({
      user,
      dateContext,
      extraHolidays: config.extraHolidays,
      timeZone: config.timeZone,
    });

    if (!eligibility.eligible) {
      return {
        status: 'skipped',
        reason: eligibility.reason,
        date: dateContext.dateStr,
      };
    }

    const attendances = await client.getAttendances({
      participantId: user.id,
      startDate: dateContext.dateStr,
      endDate: dateContext.dateStr,
    });

    const decision = evaluateAttendance({
      user,
      attendances,
      dateContext,
      extraHolidays: config.extraHolidays,
      webUrl: config.webUrl,
      timeZone: config.timeZone,
    });

    if (!decision.shouldNotify) {
      return {
        status: 'skipped',
        reason: decision.reason,
        date: dateContext.dateStr,
      };
    }

    await notifier.sendEmail(decision.email);
    return {
      status: 'reminder_sent',
      reason: decision.reason,
      date: dateContext.dateStr,
    };
  } catch (error) {
    if (error instanceof AuthExpiredError) {
      await notifier.sendEmail(
        buildAuthExpiredEmail({ dateStr: dateContext.dateStr, webUrl: config.webUrl })
      );
      return {
        status: 'auth_expired_notified',
        reason: 'auth_expired',
        date: dateContext.dateStr,
      };
    }
    throw error;
  }
}
