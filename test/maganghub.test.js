import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AuthExpiredError, createMagangHubClient } from '../src/maganghub.js';

describe('MagangHub API client', () => {
  it('sends Authorization and Cookie headers when fetching /users/me', async () => {
    let capturedUrl = '';
    let capturedOptions = null;

    const fakeFetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: { id: 'user-1', name: 'Dian' } }),
      };
    };

    const client = createMagangHubClient({
      authToken: 'my-jwt',
      cookie: 'sid=xyz',
      apiBase: 'https://monev-api.maganghub.kemnaker.go.id/api/v1',
      fetchImpl: fakeFetch,
    });

    const me = await client.getMe();
    assert.equal(capturedUrl, 'https://monev-api.maganghub.kemnaker.go.id/api/v1/users/me');
    assert.equal(capturedOptions.headers.Authorization, 'Bearer my-jwt');
    assert.equal(capturedOptions.headers.Cookie, 'sid=xyz');
    assert.deepEqual(me, { id: 'user-1', name: 'Dian' });
  });

  it('fetches attendances with participant_id, start_date, and end_date query params', async () => {
    let capturedUrl = '';

    const fakeFetch = async (url) => {
      capturedUrl = url;
      return {
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 1, date: '2026-11-23', status: 'PRESENT' }] }),
      };
    };

    const client = createMagangHubClient({
      authToken: 'my-jwt',
      apiBase: 'https://monev-api.maganghub.kemnaker.go.id/api/v1',
      fetchImpl: fakeFetch,
    });

    const list = await client.getAttendances({
      participantId: 'p-123',
      startDate: '2026-11-23',
      endDate: '2026-11-23',
    });

    assert.equal(
      capturedUrl,
      'https://monev-api.maganghub.kemnaker.go.id/api/v1/attendances?participant_id=p-123&start_date=2026-11-23&end_date=2026-11-23'
    );
    assert.equal(list.length, 1);
  });

  it('throws AuthExpiredError on 401 or 403 responses', async () => {
    const fakeFetch = async () => ({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const client = createMagangHubClient({
      authToken: 'expired-jwt',
      apiBase: 'https://monev-api.maganghub.kemnaker.go.id/api/v1',
      fetchImpl: fakeFetch,
    });

    await assert.rejects(() => client.getMe(), AuthExpiredError);
  });
});
