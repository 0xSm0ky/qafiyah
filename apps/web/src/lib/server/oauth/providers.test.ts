import { describe, expect, it } from 'vitest';

import { authorizeUrl, PROVIDERS, resolveProvider } from './providers';

describe('resolveProvider', () => {
  it('accepts the two supported providers', () => {
    expect(resolveProvider('google')).toBe('google');
    expect(resolveProvider('github')).toBe('github');
  });

  it('refuses anything else', () => {
    expect(resolveProvider('facebook')).toBeUndefined();
    expect(resolveProvider('')).toBeUndefined();
    expect(resolveProvider(undefined)).toBeUndefined();
    expect(resolveProvider('../../etc')).toBeUndefined();
  });
});

describe('authorizeUrl', () => {
  it('carries the scopes the verified-email check needs', () => {
    expect(PROVIDERS.google.scope).toContain('email');
    expect(PROVIDERS.github.scope).toContain('user:email');
  });

  it('includes state and the redirect uri', () => {
    const url = new URL(
      authorizeUrl('google', 'st8', 'https://qafiyah.com/auth/callback/google', 'cid')
    );
    expect(url.searchParams.get('state')).toBe('st8');
    expect(url.searchParams.get('redirect_uri')).toBe('https://qafiyah.com/auth/callback/google');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('client_id')).toBe('cid');
  });
});
