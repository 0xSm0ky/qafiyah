import { describe, expect, it, vi } from 'vitest';

const captured: { headers?: unknown; baseUrl?: string | undefined; cache?: string | undefined } =
  {};
vi.mock('openapi-fetch', () => ({
  default: vi.fn((opts: { headers?: unknown; baseUrl?: string; cache?: string }) => {
    captured.headers = opts.headers;
    captured.baseUrl = opts.baseUrl;
    captured.cache = opts.cache;
    return { GET: vi.fn() };
  }),
}));

describe('apiBrowser', () => {
  it('calls the same-origin proxy, not the api host', async () => {
    await import('./browser-client');
    expect(captured.baseUrl).toBe('/api/v1');
  });

  it('sends no api key from the browser', () => {
    expect(captured.headers).toBeUndefined();
  });

  it('skips the browser http cache, since react query already caches results in memory', () => {
    expect(captured.cache).toBe('no-store');
  });
});
