import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATE_COOKIE_NAME = 'qaf_oauth_state';

beforeEach(() => {
  vi.resetModules();
  vi.doUnmock('@/lib/constants/config');
});

async function load(isDev: boolean) {
  vi.doMock('@/lib/constants/config', () => ({ isDev }));
  return await import('./redirect');
}

describe('redirectUriFor', () => {
  it('uses the request origin in dev', async () => {
    const { redirectUriFor } = await load(true);
    expect(redirectUriFor('google', new URL('https://dev.local/auth/google'))).toBe(
      'https://dev.local/auth/callback/google'
    );
  });

  it('uses the production site url in production', async () => {
    const { redirectUriFor } = await load(false);
    expect(redirectUriFor('google', new URL('https://dev.local/auth/google'))).toBe(
      'https://qafiyah.com/auth/callback/google'
    );
  });
});

describe('stateCookieAttributes', () => {
  it('is HttpOnly, Secure, Lax, scoped to /auth, and expires in ten minutes', async () => {
    const { stateCookieAttributes } = await load(true);
    const attributes = stateCookieAttributes();
    expect(attributes).toContain('Path=/auth');
    expect(attributes).toContain('HttpOnly');
    expect(attributes).toContain('Secure');
    expect(attributes).toContain('SameSite=Lax');
    expect(attributes).toContain('Max-Age=600');
  });
});

describe('readStateCookie', () => {
  it('finds the state cookie among others', async () => {
    const { readStateCookie } = await load(true);
    expect(readStateCookie(`theme=dark; ${STATE_COOKIE_NAME}=st8; other=1`)).toBe('st8');
  });

  it('returns nothing when absent, empty, or malformed', async () => {
    const { readStateCookie } = await load(true);
    expect(readStateCookie('theme=dark')).toBeUndefined();
    expect(readStateCookie('')).toBeUndefined();
    expect(readStateCookie(null)).toBeUndefined();
    expect(readStateCookie(`not_${STATE_COOKIE_NAME}=st8`)).toBeUndefined();
  });
});
