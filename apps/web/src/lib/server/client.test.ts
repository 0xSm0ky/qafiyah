import { describe, expect, it, vi } from 'vitest';

const captured: { headers?: unknown; baseUrl?: string | undefined } = {};
vi.mock('openapi-fetch', () => ({
  default: vi.fn((opts: { headers?: unknown; baseUrl?: string }) => {
    captured.headers = opts.headers;
    captured.baseUrl = opts.baseUrl;
    return { GET: vi.fn() };
  }),
}));

describe('apiServer', () => {
  it('sends the internal key as the x-api-key header', async () => {
    process.env['INTERNAL_API_KEY'] = 'internal-key';
    await import('./client');
    expect((captured.headers as Record<string, string>)['x-api-key']).toBe('internal-key');
  });

  it('points at the versioned prefix', () => {
    expect(captured.baseUrl).toMatch(/\/v1$/);
  });
});
