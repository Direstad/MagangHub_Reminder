import { getDateContext, isWithinDateRange } from './date.js';

export function buildReminderEmail({ participantName, dateContext, webUrl }) {
  const name = participantName || 'Peserta Magang';
  const subject = `[MagangHub] Pengingat Absensi Harian (${dateContext.dateStr})`;

  const text = [
    `Halo ${name},`,
    '',
    `Sudah pukul 18:00 WIB. Pastikan kamu sudah mengisi absensi & laporan harian MagangHub untuk tanggal ${dateContext.dateStr}.`,
    '',
    `Buka MagangHub di sini: ${webUrl}`,
    '',
    'Jika sudah mengisi absensi hari ini, abaikan email ini.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #1d4ed8; margin-bottom: 8px;">Pengingat Absensi MagangHub</h2>
      <p>Halo <strong>${name}</strong>,</p>
      <p>
        Sudah pukul <strong>18:00 WIB</strong>. Pastikan kamu sudah mengisi absensi &amp; laporan harian
        MagangHub untuk tanggal <strong>${dateContext.dateStr}</strong>.
      </p>
      <p style="margin: 20px 0;">
        <a href="${webUrl}" style="background-color: #2563eb; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Buka MagangHub &amp; Cek Absen
        </a>
      </p>
      <p style="font-size: 12px; color: #6b7280;">
        Jika kamu sudah mengisi absensi hari ini, abaikan saja email ini.<br />
        Link langsung: <a href="${webUrl}">${webUrl}</a>
      </p>
    </div>
  `.trim();

  return { subject, text, html };
}

export function evaluateSchedule({ config, dateContext }) {
  if (
    !isWithinDateRange(
      dateContext.dateStr,
      config.internshipStartDate,
      config.internshipEndDate,
      config.timeZone
    )
  ) {
    return { shouldNotify: false, reason: 'outside_internship_period' };
  }

  const offDays = (config.offDays || []).map((day) => String(day).toUpperCase());
  if (offDays.includes(dateContext.dayName)) {
    return { shouldNotify: false, reason: 'off_day' };
  }

  if ((config.extraHolidays || []).includes(dateContext.dateStr)) {
    return { shouldNotify: false, reason: 'extra_holiday' };
  }

  return {
    shouldNotify: true,
    reason: 'scheduled_workday',
    email: buildReminderEmail({
      participantName: config.participantName,
      dateContext,
      webUrl: config.webUrl,
    }),
  };
}

export async function runScheduledReminder({ notifier, config, now = new Date() }) {
  const dateContext = getDateContext(now, config.timeZone);
  const decision = evaluateSchedule({ config, dateContext });

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
}
