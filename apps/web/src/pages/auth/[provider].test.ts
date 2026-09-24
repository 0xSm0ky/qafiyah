import { afterEach, describe, expect, it, vi } from 'vitest';

import { fakeContext } from '@/test/context';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function load() {
  return await import('./[provider]');
}

describe('GET /auth/[provider]', () => {
  it('404s for an unknown provider', async () => {
    const { GET } = await load();
    const response = await GET(
      fakeContext({ url: 'https://qafiyah.com/auth/facebook', params: { provider: 'facebook' } })
    );
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('404s for a known provider with no client configured', async () => {
    process.env['OAUTH_GOOGLE_CLIENT_ID'] = '';
    process.env['OAUTH_GOOGLE_CLIENT_SECRET'] = '';
    const { GET } = await load();
    const response = await GET(
      fakeContext({ url: 'https://qafiyah.com/auth/google', params: { provider: 'google' } })
    );
    expect(response.status).toBe(404);
  });

  it('redirects to the provider with a signed state and a scoped state cookie', async () => {
    process.env['SESSION_STATE_SECRET'] = 'test-secret';
    process.env['OAUTH_GOOGLE_CLIENT_ID'] = 'gid';
    process.env['OAUTH_GOOGLE_CLIENT_SECRET'] = 'gsecret';
    const { GET } = await load();
    const response = await GET(
      fakeContext({ url: 'https://qafiyah.com/auth/google', params: { provider: 'google' } })
    );
    expect(response.status).toBe(302);
    const location = response.headers.get('location') ?? '';
    expect(location.startsWith('https://accounts.google.com/o/oauth2/v2/auth')).toBe(true);
    const target = new URL(location);
    expect(target.searchParams.get('client_id')).toBe('gid');
    expect(target.searchParams.get('state')).toMatch(/\./);
    const cookie = response.headers.get('set-cookie') ?? '';
    expect(cookie).toContain('qaf_oauth_state=');
    expect(cookie).toContain('Path=/auth');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });
});
