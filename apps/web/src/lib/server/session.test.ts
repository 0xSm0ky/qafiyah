import { afterEach, describe, expect, it, vi } from 'vitest';

import { readSessionId, resolveViewer, SESSION_COOKIE, sessionCookieAttributes } from './session';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readSessionId', () => {
  it('finds the session cookie among others', () => {
    expect(readSessionId(`theme=dark; ${SESSION_COOKIE}=abc123; other=1`)).toBe('abc123');
  });

  it('returns nothing when absent or malformed', () => {
    expect(readSessionId('theme=dark')).toBeUndefined();
    expect(readSessionId('')).toBeUndefined();
    expect(readSessionId(null)).toBeUndefined();
  });

  it('is not fooled by a cookie whose name merely ends with the session name', () => {
    expect(readSessionId(`not_${SESSION_COOKIE}=abc123`)).toBeUndefined();
  });
});

describe('sessionCookieAttributes', () => {
  it('is HttpOnly, Secure, Lax, and site-wide', () => {
    const attributes = sessionCookieAttributes(60);
    expect(attributes).toContain('HttpOnly');
    expect(attributes).toContain('Secure');
    expect(attributes).toContain('SameSite=Lax');
    expect(attributes).toContain('Path=/');
    expect(attributes).toContain('Max-Age=60');
  });
});

describe('resolveViewer', () => {
  it('returns undefined when there is no session cookie', async () => {
    expect(await resolveViewer(null)).toBeUndefined();
  });

  it('fetches the profile and maps snake_case to camelCase', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              id: 1,
              email: 'a@b.test',
              display_name: 'أ',
              avatar_url: 'https://x.test/a.png',
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
      )
    );
    const profile = await resolveViewer(`${SESSION_COOKIE}=abc123`);
    expect(profile).toEqual({
      id: 1,
      email: 'a@b.test',
      displayName: 'أ',
      avatarUrl: 'https://x.test/a.png',
    });
  });

  it('returns undefined when the session has expired (API 404)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 404 }))
    );
    expect(await resolveViewer(`${SESSION_COOKIE}=expired`)).toBeUndefined();
  });
});
