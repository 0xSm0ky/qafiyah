import { afterEach, describe, expect, it, vi } from 'vitest';

process.env['INTERNAL_API_URL'] = 'http://api.test';
process.env['INTERNAL_API_KEY'] = 'internal-key';

import { fakeContext } from '@/test/context';

afterEach(() => {
  vi.unstubAllGlobals();
});

async function load() {
  return await import('./keys');
}

function signedInFetch() {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const path = new URL(request.url).pathname;
    if (path === '/account/sessions/sess-1') {
      return new Response(
        JSON.stringify({ id: 1, email: 'a@b.test', display_name: null, avatar_url: null }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    if (path === '/account/keys') {
      return new Response(JSON.stringify({ value: 'qaf_NEWKEY123' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(null, { status: 204 });
  });
}

function signedInFetchWithRevokeStatus(status: number) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const path = new URL(request.url).pathname;
    if (path === '/account/sessions/sess-1') {
      return new Response(
        JSON.stringify({ id: 1, email: 'a@b.test', display_name: null, avatar_url: null }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    if (path === '/account/keys/revoke') {
      return new Response(null, { status });
    }
    return new Response(JSON.stringify({ value: 'qaf_NEWKEY123' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
}

describe('POST /account/keys', () => {
  it('redirects to /login when anonymous', async () => {
    const { POST } = await load();
    const response = await POST(
      fakeContext({ method: 'POST', url: 'https://qafiyah.com/account/keys' })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/login');
  });

  it('creates a key and sets the short-lived new-key cookie', async () => {
    vi.stubGlobal('fetch', signedInFetch());
    const { POST } = await load();
    const body = new URLSearchParams({ action: 'create' });
    const response = await POST(
      fakeContext({
        method: 'POST',
        url: 'https://qafiyah.com/account/keys',
        cookies: { qaf_session: 'sess-1' },
        body,
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/account');
    expect(response.headers.get('set-cookie')).toContain('qaf_new_key=qaf_NEWKEY123');
    expect(response.headers.get('set-cookie')).toContain('Path=/account');
  });

  it('revokes a key and redirects back', async () => {
    const mock = signedInFetch();
    vi.stubGlobal('fetch', mock);
    const { POST } = await load();
    const body = new URLSearchParams({ action: 'revoke', key_id: '5' });
    const response = await POST(
      fakeContext({
        method: 'POST',
        url: 'https://qafiyah.com/account/keys',
        cookies: { qaf_session: 'sess-1' },
        body,
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/account');
    const revoke = mock.mock.calls.find((c) => (c[0] as string).endsWith('/keys/revoke'));
    expect(revoke).toBeTruthy();
  });

  it('treats a 404 from revoke (already revoked) as success', async () => {
    vi.stubGlobal('fetch', signedInFetchWithRevokeStatus(404));
    const { POST } = await load();
    const body = new URLSearchParams({ action: 'revoke', key_id: '5' });
    const response = await POST(
      fakeContext({
        method: 'POST',
        url: 'https://qafiyah.com/account/keys',
        cookies: { qaf_session: 'sess-1' },
        body,
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/account');
  });

  it('redirects with error when revoke fails', async () => {
    vi.stubGlobal('fetch', signedInFetchWithRevokeStatus(500));
    const { POST } = await load();
    const body = new URLSearchParams({ action: 'revoke', key_id: '5' });
    const response = await POST(
      fakeContext({
        method: 'POST',
        url: 'https://qafiyah.com/account/keys',
        cookies: { qaf_session: 'sess-1' },
        body,
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/account?error=1');
  });

  it('redirects with error when key_id is missing or zero', async () => {
    vi.stubGlobal('fetch', signedInFetch());
    const { POST } = await load();
    const body = new URLSearchParams({ action: 'revoke' });
    const response = await POST(
      fakeContext({
        method: 'POST',
        url: 'https://qafiyah.com/account/keys',
        cookies: { qaf_session: 'sess-1' },
        body,
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/account?error=1');
  });

  it('redirects with error rather than throwing when the body is not form data', async () => {
    vi.stubGlobal('fetch', signedInFetch());
    const { POST } = await load();
    const response = await POST(
      fakeContext({
        method: 'POST',
        url: 'https://qafiyah.com/account/keys',
        cookies: { qaf_session: 'sess-1' },
        body: 'not form data',
        headers: { 'content-type': 'text/plain' },
      })
    );
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/account?error=1');
  });
});
