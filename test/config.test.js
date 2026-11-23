import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../src/config.js';

describe('loadConfig', () => {
  it('loads valid config with defaults', () => {
    const cfg = loadConfig({
      MAGANGHUB_AUTH_TOKEN: 'jwt-token-123',
      GMAIL_USER: 'user@gmail.com',
      GMAIL_APP_PASSWORD: 'app-password',
    });

    assert.equal(cfg.authToken, 'jwt-token-123');
    assert.equal(cfg.cookie, '');
    assert.equal(cfg.gmailUser, 'user@gmail.com');
    assert.equal(cfg.gmailAppPassword, 'app-password');
    assert.equal(cfg.toEmail, 'user@gmail.com');
    assert.equal(cfg.timeZone, 'Asia/Jakarta');
    assert.deepEqual(cfg.extraHolidays, []);
  });

  it('accepts cookie auth and parses EXTRA_HOLIDAYS and REMINDER_TO_EMAIL', () => {
    const cfg = loadConfig({
      MAGANGHUB_COOKIE: 'session=abc',
      GMAIL_USER: 'sender@gmail.com',
      GMAIL_APP_PASSWORD: 'secret',
      REMINDER_TO_EMAIL: 'recipient@gmail.com',
      EXTRA_HOLIDAYS: '2026-12-25, 2027-01-01 , ',
      TIMEZONE: 'Asia/Makassar',
    });

    assert.equal(cfg.cookie, 'session=abc');
    assert.equal(cfg.toEmail, 'recipient@gmail.com');
    assert.equal(cfg.timeZone, 'Asia/Makassar');
    assert.deepEqual(cfg.extraHolidays, ['2026-12-25', '2027-01-01']);
  });

  it('throws when both auth token and cookie are missing', () => {
    assert.throws(
      () =>
        loadConfig({
          GMAIL_USER: 'user@gmail.com',
          GMAIL_APP_PASSWORD: 'secret',
        }),
      /MAGANGHUB_AUTH_TOKEN|MAGANGHUB_COOKIE/
    );
  });

  it('throws when Gmail credentials are missing', () => {
    assert.throws(
      () =>
        loadConfig({
          MAGANGHUB_AUTH_TOKEN: 'jwt-token-123',
        }),
      /GMAIL_USER|GMAIL_APP_PASSWORD/
    );
  });
});
