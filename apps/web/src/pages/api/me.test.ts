import { afterEach, describe, expect, it, vi } from 'vitest';

process.env['INTERNAL_API_URL'] = 'http://api.test';
process.env['INTERNAL_API_KEY'] = 'internal-key';

import { fakeContext } from '@/test/context';

afterEach(() => {
  vi.unstubAllGlobals();
});

async function load() {
  return await import('./me');
}

describe('GET /api/me', () => {
  it('is 204 and uncacheable when anonymous', async () => {
    const { GET } = await load();
    const response = await GET(fakeContext({ url: 'https://qafiyah.com/api/me' }));
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('returns the display profile when signed in', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ id: 1, email: 'a@b.test', display_name: 'أ', avatar_url: null }),
            {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }
          )
      )
    );
    const { GET } = await load();
    const response = await GET(
      fakeContext({ url: 'https://qafiyah.com/api/me', cookies: { qaf_session: 'sess-1' } })
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ displayName: 'أ', avatarUrl: null });
  });
});
