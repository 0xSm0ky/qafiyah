import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/server/client', () => ({ apiServer: { GET: vi.fn() } }));

import { apiServer } from '@/lib/server/client';
import { fakeContext } from '@/test/context';

import { GET } from './[page].xml';

const get = apiServer.GET as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  get.mockReset();
});

describe('GET /sitemap/poems/[page].xml', () => {
  it('returns a well-formed urlset of absolute poem urls', async () => {
    get.mockResolvedValue({
      data: { data: ['aBcD', 'eFgH'], pagination: { page: 1 } },
      response: new Response(null, { status: 200 }),
    });
    const response = await GET(fakeContext({ params: { page: '1' } }));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
    const text = await response.text();
    expect(text).toContain('<urlset');
    expect(text).toContain('<loc>http://localhost:4321/poems/aBcD</loc>');
    expect(text).toContain('<loc>http://localhost:4321/poems/eFgH</loc>');
  });

  it('404s for a non-numeric page', async () => {
    const response = await GET(fakeContext({ params: { page: 'abc' } }));
    expect(response.status).toBe(404);
  });

  it('404s when the API reports the page as out of range (400 or 404), not 500', async () => {
    get.mockResolvedValue({
      data: undefined,
      error: { status: 400 },
      response: new Response(null, { status: 400 }),
    });
    const response = await GET(fakeContext({ params: { page: '99999' } }));
    expect(response.status).toBe(404);
  });

  it('404s when the shard is empty', async () => {
    get.mockResolvedValue({
      data: { data: [], pagination: { page: 1 } },
      response: new Response(null, { status: 200 }),
    });
    const response = await GET(fakeContext({ params: { page: '2' } }));
    expect(response.status).toBe(404);
  });
});
