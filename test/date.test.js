import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDateContext, isWithinDateRange } from '../src/date.js';

describe('date utilities', () => {
  it('converts UTC timestamp to Asia/Jakarta date and weekday name', () => {
    // 2026-11-22 18:30 UTC === 2026-11-23 01:30 WIB (Monday)
    const now = new Date('2026-11-22T18:30:00Z');
    const ctx = getDateContext(now, 'Asia/Jakarta');

    assert.equal(ctx.dateStr, '2026-11-23');
    assert.equal(ctx.dayName, 'MONDAY');
  });

  it('identifies Sunday correctly in Asia/Jakarta', () => {
    const now = new Date('2026-11-22T11:00:00Z'); // 18:00 WIB Sunday
    const ctx = getDateContext(now, 'Asia/Jakarta');

    assert.equal(ctx.dateStr, '2026-11-22');
    assert.equal(ctx.dayName, 'SUNDAY');
  });

  it('checks whether dateStr is within internship start and end dates', () => {
    const start = '2026-08-10T00:00:00+07:00';
    const end = '2027-02-09T23:59:59+07:00';

    assert.equal(isWithinDateRange('2026-08-10', start, end), true);
    assert.equal(isWithinDateRange('2026-11-23', start, end), true);
    assert.equal(isWithinDateRange('2027-02-09', start, end), true);
    assert.equal(isWithinDateRange('2026-08-09', start, end), false);
    assert.equal(isWithinDateRange('2027-02-10', start, end), false);
  });
});
