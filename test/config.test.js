import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('loads valid config with Gmail credentials and sensible defaults', () => {
    const cfg = loadConfig({
      GMAIL_USER: 'user@gmail.com',
      GMAIL_APP_PASSWORD: 'app-password',
    });

    assert.equal(cfg.gmailUser, 'user@gmail.com');
    assert.equal(cfg.gmailAppPassword, 'app-password');
    assert.equal(cfg.toEmail, 'user@gmail.com');
    assert.equal(cfg.timeZone, 'Asia/Jakarta');
    assert.deepEqual(cfg.offDays, ['SUNDAY']);
    assert.deepEqual(cfg.extraHolidays, []);
    assert.equal(cfg.webUrl, 'https://monev.maganghub.kemnaker.go.id/');
  });

  it('parses optional OFF_DAYS, EXTRA_HOLIDAYS, REMINDER_TO_EMAIL, and period dates', () => {
    const cfg = loadConfig({
      GMAIL_USER: 'sender@gmail.com',
      GMAIL_APP_PASSWORD: 'secret',
      REMINDER_TO_EMAIL: 'recipient@gmail.com',
      PARTICIPANT_NAME: 'Dian Restu Adji',
      OFF_DAYS: 'sunday, saturday',
      EXTRA_HOLIDAYS: '2026-12-25, 2027-01-01 , ',
      INTERNSHIP_START_DATE: '2026-08-10',
      INTERNSHIP_END_DATE: '2027-02-09',
      TIMEZONE: 'Asia/Makassar',
    });

    assert.equal(cfg.toEmail, 'recipient@gmail.com');
    assert.equal(cfg.participantName, 'Dian Restu Adji');
    assert.deepEqual(cfg.offDays, ['SUNDAY', 'SATURDAY']);
    assert.deepEqual(cfg.extraHolidays, ['2026-12-25', '2027-01-01']);
    assert.equal(cfg.internshipStartDate, '2026-08-10');
    assert.equal(cfg.internshipEndDate, '2027-02-09');
    assert.equal(cfg.timeZone, 'Asia/Makassar');
  });

  it('throws when Gmail credentials are missing', () => {
    assert.throws(() => loadConfig({}), /GMAIL_USER|GMAIL_APP_PASSWORD/);
  });
});
