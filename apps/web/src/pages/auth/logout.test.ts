import { afterEach, describe, expect, it, vi } from 'vitest';

process.env['INTERNAL_API_URL'] = 'http://api.test';
process.env['INTERNAL_API_KEY'] = 'internal-key';

import { fakeContext } from '@/test/context';

afterEach(() => {
  vi.unstubAllGlobals();
});

async function load() {
  return await import('./logout');
}

describe('POST /auth/logout', () => {
  it('clears both cookies and redirects home when signed out', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { POST } = await load();
    const response = await POST(fakeContext({ method: 'POST' }));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/');
    const setCookies = response.headers.get('set-cookie') ?? '';
    expect(setCookies).toContain('qaf_session=;');
    expect(setCookies).toContain('qaf_viewer=;');
  });

  it('deletes the session on the API when a session cookie is present', async () => {
    let deletedUrl = '';
    const mock = vi.fn(async (url: string | URL | Request) => {
      if (typeof url === 'string') deletedUrl = url;
      else if (url instanceof URL) deletedUrl = url.href;
      else deletedUrl = url.url;
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal('fetch', mock);
    const { POST } = await load();
    const response = await POST(
      fakeContext({ method: 'POST', cookies: { qaf_session: 'sess-1' } })
    );
    expect(response.status).toBe(302);
    expect(deletedUrl).toBe('http://api.test/account/sessions/sess-1');
  });
});
