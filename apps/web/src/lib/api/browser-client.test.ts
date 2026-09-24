import { describe, expect, it, vi } from 'vitest';

const captured: { headers?: unknown; baseUrl?: string | undefined } = {};
vi.mock('openapi-fetch', () => ({
  default: vi.fn((opts: { headers?: unknown; baseUrl?: string }) => {
    captured.headers = opts.headers;
    captured.baseUrl = opts.baseUrl;
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
});
