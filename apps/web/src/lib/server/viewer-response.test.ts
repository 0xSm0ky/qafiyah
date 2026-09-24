import { describe, expect, it } from 'vitest';

import { viewerResponse } from './viewer-response';

const VIEWER = {
  id: 1,
  email: 'a@b.test',
  displayName: 'A B',
  avatarUrl: 'https://x.test/a.png',
} as const;

describe('viewerResponse', () => {
  it('is 204 and uncacheable when signed out', async () => {
    const response = viewerResponse(undefined);
    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('returns only the display fields, never the id or email', async () => {
    const body = await viewerResponse(VIEWER).json();
    expect(body).toEqual({ displayName: 'A B', avatarUrl: 'https://x.test/a.png' });
  });

  it('is uncacheable when signed in', () => {
    expect(viewerResponse(VIEWER).headers.get('cache-control')).toBe('no-store');
  });

  it('falls back to the email when the provider gave no name', async () => {
    const body = await viewerResponse({ ...VIEWER, displayName: null }).json();
    expect(body).toEqual({ displayName: 'a@b.test', avatarUrl: 'https://x.test/a.png' });
  });
});
