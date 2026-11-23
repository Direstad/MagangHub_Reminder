import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateSchedule, runScheduledReminder } from '../src/reminder.js';

const baseConfig = {
  participantName: 'Dian Restu Adji',
  offDays: ['SUNDAY'],
  extraHolidays: ['2026-12-25'],
  internshipStartDate: '2026-08-10',
  internshipEndDate: '2027-02-09',
  timeZone: 'Asia/Jakarta',
  webUrl: 'https://monev.maganghub.kemnaker.go.id/',
};

describe('evaluateSchedule', () => {
  it('triggers reminder email on active workday', () => {
    const result = evaluateSchedule({
      config: baseConfig,
      dateContext: { dateStr: '2026-11-23', dayName: 'MONDAY' },
    });

    assert.equal(result.shouldNotify, true);
    assert.equal(result.reason, 'scheduled_workday');
    assert.match(result.email.subject, /2026-11-23/);
    assert.match(result.email.text, /https:\/\/monev\.maganghub\.kemnaker\.go\.id\//);
  });

  it('skips reminder on configured off_days (SUNDAY)', () => {
    const result = evaluateSchedule({
      config: baseConfig,
      dateContext: { dateStr: '2026-11-22', dayName: 'SUNDAY' },
    });

    assert.equal(result.shouldNotify, false);
    assert.equal(result.reason, 'off_day');
  });

  it('skips reminder on EXTRA_HOLIDAYS', () => {
    const result = evaluateSchedule({
      config: baseConfig,
      dateContext: { dateStr: '2026-12-25', dayName: 'FRIDAY' },
    });

    assert.equal(result.shouldNotify, false);
    assert.equal(result.reason, 'extra_holiday');
  });

  it('skips reminder outside internship period', () => {
    const result = evaluateSchedule({
      config: baseConfig,
      dateContext: { dateStr: '2027-02-15', dayName: 'MONDAY' },
    });

    assert.equal(result.shouldNotify, false);
    assert.equal(result.reason, 'outside_internship_period');
  });
});

describe('runScheduledReminder', () => {
  it('sends email on workday at 18:00 WIB', async () => {
    const sentEmails = [];
    const notifier = {
      sendEmail: async (payload) => sentEmails.push(payload),
    };

    const outcome = await runScheduledReminder({
      notifier,
      config: baseConfig,
      now: new Date('2026-11-23T11:00:00Z'), // Monday 18:00 WIB
    });

    assert.equal(outcome.status, 'reminder_sent');
    assert.equal(outcome.date, '2026-11-23');
    assert.equal(sentEmails.length, 1);
  });

  it('skips sending email on Sunday', async () => {
    const sentEmails = [];
    const notifier = {
      sendEmail: async (payload) => sentEmails.push(payload),
    };

    const outcome = await runScheduledReminder({
      notifier,
      config: baseConfig,
      now: new Date('2026-11-22T11:00:00Z'), // Sunday 18:00 WIB
    });

    assert.equal(outcome.status, 'skipped');
    assert.equal(outcome.reason, 'off_day');
    assert.equal(sentEmails.length, 0);
  });
});
