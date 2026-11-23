export class AuthExpiredError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

export function createMagangHubClient({ authToken = '', cookie = '', apiBase, fetchImpl = fetch }) {
  const baseUrl = apiBase.replace(/\/+$/, '');

  function buildHeaders() {
    const headers = {
      Accept: 'application/json',
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    if (cookie) {
      headers.Cookie = cookie;
    }

    return headers;
  }

  async function requestJson(url) {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: buildHeaders(),
    });

    if (response.status === 401 || response.status === 403) {
      throw new AuthExpiredError(
        `Sesi atau token MagangHub kedaluwarsa (HTTP ${response.status}).`
      );
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new Error(`MagangHub API error (HTTP ${response.status}): ${errorBody}`);
    }

    const payload = await response.json();
    return payload?.data;
  }

  return {
    async getMe() {
      return requestJson(`${baseUrl}/users/me`);
    },

    async getAttendances({ participantId, startDate, endDate }) {
      const params = new URLSearchParams({
        participant_id: participantId,
        start_date: startDate,
        end_date: endDate,
      });
      const data = await requestJson(`${baseUrl}/attendances?${params.toString()}`);
      return Array.isArray(data) ? data : [];
    },
  };
}
