import { afterEach, describe, expect, it, vi } from 'vitest';

process.env['INTERNAL_API_URL'] = 'http://api.test';
process.env['INTERNAL_API_KEY'] = 'internal-key';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function toUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

describe('accountFetch', () => {
  it('returns the parsed body and sets the internal key', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;
    const mock = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = toUrl(url);
      capturedInit = init;
      return json({ id: 1 });
    });
    vi.stubGlobal('fetch', mock);
    const { accountFetch } = await import('./account-client');
    const result = await accountFetch<{ id: number }>('/users', { method: 'POST', body: '{}' });
    expect(result).toEqual({ ok: true, status: 200, value: { id: 1 } });
    expect(capturedUrl).toBe('http://api.test/account/users');
    const headers = capturedInit ? new Headers(capturedInit.headers) : new Headers();
    expect(headers.get('x-api-key')).toBe('internal-key');
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('returns a failed result for a non-OK status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({}, 500))
    );
    const { accountFetch } = await import('./account-client');
    expect(await accountFetch('/users')).toEqual({ ok: false, status: 500 });
  });

  it('returns an ok result with no value for a 204 with no body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 204 }))
    );
    const { accountFetch } = await import('./account-client');
    expect(await accountFetch('/sessions/x', { method: 'DELETE' })).toEqual({
      ok: true,
      status: 204,
      value: undefined,
    });
  });

  it('returns a failed result when a 200 body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('not json', { status: 200 }))
    );
    const { accountFetch } = await import('./account-client');
    expect(await accountFetch('/users')).toEqual({ ok: false, status: 200 });
  });

  it('returns a failed result with no status when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('down');
      })
    );
    const { accountFetch } = await import('./account-client');
    expect(await accountFetch('/users')).toEqual({ ok: false, status: null });
  });
});
