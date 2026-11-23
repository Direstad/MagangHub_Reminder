import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuthExpiredError } from '../src/maganghub.js';
import { evaluateAttendance, runReminderCheck } from '../src/reminder.js';

const sampleUser = {
  id: 'e43137ae-7579-4db1-9fae-3d8de6aa0b5f',
  name: 'Dian Restu Adji',
  internship_company: 'Language Center',
  off_days: ['SUNDAY'],
  participant_status: { active_internship: true },
  internship_start_date: '2026-08-10T00:00:00+07:00',
  internship_end_date: '2027-02-09T23:59:59+07:00',
};

describe('evaluateAttendance', () => {
  it('triggers notification when attendance for today is missing on a workday', () => {
    const result = evaluateAttendance({
      user: sampleUser,
      attendances: [],
      dateContext: { dateStr: '2026-11-21', dayName: 'SATURDAY' },
      webUrl: 'https://monev.maganghub.kemnaker.go.id/',
    });

    assert.equal(result.shouldNotify, true);
    assert.equal(result.reason, 'missing_attendance');
    assert.match(result.email.subject, /2026-11-21/);
    assert.match(result.email.text, /https:\/\/monev\.maganghub\.kemnaker\.go\.id\//);
  });

  it('skips notification when attendance for today is already submitted', () => {
    const result = evaluateAttendance({
      user: sampleUser,
      attendances: [{ id: 16416675, date: '2026-11-23', status: 'PRESENT' }],
      dateContext: { dateStr: '2026-11-23', dayName: 'MONDAY' },
      webUrl: 'https://monev.maganghub.kemnaker.go.id/',
    });

    assert.equal(result.shouldNotify, false);
    assert.equal(result.reason, 'already_submitted');
  });

  it('skips notification on user off_days (SUNDAY)', () => {
    const result = evaluateAttendance({
      user: sampleUser,
      attendances: [],
      dateContext: { dateStr: '2026-11-22', dayName: 'SUNDAY' },
      webUrl: 'https://monev.maganghub.kemnaker.go.id/',
    });

    assert.equal(result.shouldNotify, false);
    assert.equal(result.reason, 'off_day');
  });

  it('skips notification on configured extra holidays', () => {
    const result = evaluateAttendance({
      user: sampleUser,
      attendances: [],
      dateContext: { dateStr: '2026-12-25', dayName: 'FRIDAY' },
      extraHolidays: ['2026-12-25'],
      webUrl: 'https://monev.maganghub.kemnaker.go.id/',
    });

    assert.equal(result.shouldNotify, false);
    assert.equal(result.reason, 'extra_holiday');
  });

  it('skips notification when internship is inactive or outside period', () => {
    const inactiveResult = evaluateAttendance({
      user: { ...sampleUser, participant_status: { active_internship: false } },
      attendances: [],
      dateContext: { dateStr: '2026-11-23', dayName: 'MONDAY' },
      webUrl: 'https://monev.maganghub.kemnaker.go.id/',
    });
    assert.equal(inactiveResult.shouldNotify, false);
    assert.equal(inactiveResult.reason, 'inactive_internship');

    const outsideResult = evaluateAttendance({
      user: sampleUser,
      attendances: [],
      dateContext: { dateStr: '2027-02-15', dayName: 'MONDAY' },
      webUrl: 'https://monev.maganghub.kemnaker.go.id/',
    });
    assert.equal(outsideResult.shouldNotify, false);
    assert.equal(outsideResult.reason, 'outside_internship_period');
  });
});

describe('runReminderCheck', () => {
  const baseConfig = {
    timeZone: 'Asia/Jakarta',
    extraHolidays: [],
    webUrl: 'https://monev.maganghub.kemnaker.go.id/',
  };

  it('sends reminder email when attendance is missing', async () => {
    const sentEmails = [];
    const client = {
      getMe: async () => sampleUser,
      getAttendances: async () => [],
    };
    const notifier = {
      sendEmail: async (payload) => sentEmails.push(payload),
    };

    // 2026-11-21 11:00 UTC === 18:00 WIB Saturday
    const outcome = await runReminderCheck({
      client,
      notifier,
      config: baseConfig,
      now: new Date('2026-11-21T11:00:00Z'),
    });

    assert.equal(outcome.status, 'reminder_sent');
    assert.equal(sentEmails.length, 1);
    assert.match(sentEmails[0].subject, /Belum Absen/i);
  });

  it('sends auth-expired alert email when API throws AuthExpiredError', async () => {
    const sentEmails = [];
    const client = {
      getMe: async () => {
        throw new AuthExpiredError('Token expired (401)');
      },
      getAttendances: async () => {
        throw new Error('should not be called');
      },
    };
    const notifier = {
      sendEmail: async (payload) => sentEmails.push(payload),
    };

    const outcome = await runReminderCheck({
      client,
      notifier,
      config: baseConfig,
      now: new Date('2026-11-23T11:00:00Z'),
    });

    assert.equal(outcome.status, 'auth_expired_notified');
    assert.equal(sentEmails.length, 1);
    assert.match(sentEmails[0].subject, /Kedaluwarsa|Expired|Token/i);
  });

  it('does not call getAttendances or send email on Sunday', async () => {
    let attendanceCalled = false;
    const sentEmails = [];
    const client = {
      getMe: async () => sampleUser,
      getAttendances: async () => {
        attendanceCalled = true;
        return [];
      },
    };
    const notifier = {
      sendEmail: async (payload) => sentEmails.push(payload),
    };

    const outcome = await runReminderCheck({
      client,
      notifier,
      config: baseConfig,
      now: new Date('2026-11-22T11:00:00Z'), // Sunday 18:00 WIB
    });

    assert.equal(outcome.status, 'skipped');
    assert.equal(outcome.reason, 'off_day');
    assert.equal(attendanceCalled, false);
    assert.equal(sentEmails.length, 0);
  });
});
