import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { mintState } from '@/lib/server/oauth/state';
import { fakeContext } from '@/test/context';

process.env['SESSION_STATE_SECRET'] = 'test-secret';
process.env['INTERNAL_API_URL'] = 'http://api.test';
process.env['INTERNAL_API_KEY'] = 'internal-key';
process.env['OAUTH_GOOGLE_CLIENT_ID'] = 'gid';
process.env['OAUTH_GOOGLE_CLIENT_SECRET'] = 'gsecret';

function stubFetch() {
  const mock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const pathname = new URL(request.url).pathname;
    if (pathname.endsWith('/token')) {
      return new Response(JSON.stringify({ access_token: 'tok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (pathname.endsWith('/userinfo')) {
      return new Response(JSON.stringify({ sub: 'g1', email: 'a@b.test', email_verified: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (pathname.endsWith('/account/users')) {
      return new Response(JSON.stringify({ id: 7 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (pathname.endsWith('/account/sessions')) {
      return new Response(JSON.stringify({ id: 'sess-1' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(null, { status: 404 });
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.resetModules();
});

async function load() {
  return await import('./[provider]');
}

const PROVIDER = 'google';

describe('GET /auth/callback/[provider]', () => {
  it('redirects to /login?error=1 and clears the state cookie when the provider is unknown', async () => {
    const { GET } = await load();
    const response = await GET(
      fakeContext({
        url: 'https://qafiyah.com/auth/callback/facebook?code=c&state=s',
        params: { provider: 'facebook' },
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login?error=1');
    expect(response.headers.get('set-cookie')).toContain('qaf_oauth_state=;');
  });

  it('redirects to /login?error=1 when the code is missing', async () => {
    const { GET } = await load();
    const state = await mintState('test-secret', 'nonce');
    const response = await GET(
      fakeContext({
        url: `https://qafiyah.com/auth/callback/google?state=${state}`,
        cookies: { qaf_oauth_state: state },
        params: { provider: PROVIDER },
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login?error=1');
  });

  it('redirects to /login?error=1 when the cookie state does not match the query state', async () => {
    const { GET } = await load();
    const response = await GET(
      fakeContext({
        url: 'https://qafiyah.com/auth/callback/google?code=c&state=query-state',
        cookies: { qaf_oauth_state: 'different-state' },
        params: { provider: PROVIDER },
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login?error=1');
  });

  it('redirects to /login?error=1 when the state signature is invalid', async () => {
    const { GET } = await load();
    const response = await GET(
      fakeContext({
        url: 'https://qafiyah.com/auth/callback/google?code=c&state=forged.sig',
        cookies: { qaf_oauth_state: 'forged.sig' },
        params: { provider: PROVIDER },
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login?error=1');
  });

  it('sets the session and viewer cookies and clears the state cookie on success', async () => {
    stubFetch();
    const { GET } = await load();
    const state = await mintState('test-secret', 'nonce');
    const response = await GET(
      fakeContext({
        url: `https://qafiyah.com/auth/callback/google?code=c&state=${state}`,
        cookies: { qaf_oauth_state: state },
        params: { provider: PROVIDER },
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/account');
    const setCookies = response.headers.get('set-cookie') ?? '';
    expect(setCookies).toContain('qaf_session=sess-1');
    expect(setCookies).toContain('qaf_viewer=1');
    expect(setCookies).toContain('qaf_oauth_state=;');
    expect(setCookies).toContain('Max-Age=0');
  });
});
