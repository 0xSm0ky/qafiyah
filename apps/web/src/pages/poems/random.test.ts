import { afterEach, describe, expect, it, vi } from 'vitest';

process.env['INTERNAL_API_URL'] = 'http://api.test';
process.env['INTERNAL_API_KEY'] = 'internal-key';

import { fakeContext } from '@/test/context';

afterEach(() => {
  vi.unstubAllGlobals();
});

async function load() {
  return await import('./random');
}

describe('GET /poems/random', () => {
  it('redirects to the poem and is uncacheable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('abcd', { status: 200 }))
    );
    const { GET } = await load();
    const response = await GET(fakeContext({ url: 'https://qafiyah.com/poems/random' }));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/poems/abcd');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('redirects to /500 when the API keeps failing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('x', { status: 500 }))
    );
    const { GET } = await load();
    const response = await GET(fakeContext({ url: 'https://qafiyah.com/poems/random' }));
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('/500');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
