import { beforeEach, describe, expect, it, vi } from 'vitest';

import { resolveInternalApiUrl } from './env';

describe('resolveInternalApiUrl', () => {
  it('defaults to the local API dev server when unset', () => {
    expect(resolveInternalApiUrl(undefined)).toBe('http://localhost:8787');
  });

  it('returns a provided valid URL unchanged', () => {
    expect(resolveInternalApiUrl('http://api:8787')).toBe('http://api:8787');
  });

  it('throws on a non-URL value', () => {
    expect(() => resolveInternalApiUrl('not-a-url')).toThrow('INTERNAL_API_URL');
  });
});

describe('providerConfigured', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('is false for both providers when no client is set', async () => {
    process.env['OAUTH_GOOGLE_CLIENT_ID'] = '';
    process.env['OAUTH_GOOGLE_CLIENT_SECRET'] = '';
    process.env['OAUTH_GITHUB_CLIENT_ID'] = '';
    process.env['OAUTH_GITHUB_CLIENT_SECRET'] = '';
    const { providerConfigured } = await import('./env');
    expect(providerConfigured('google')).toBe(false);
    expect(providerConfigured('github')).toBe(false);
  });

  it('is true only when both the id and the secret are set', async () => {
    process.env['OAUTH_GOOGLE_CLIENT_ID'] = 'gid';
    process.env['OAUTH_GOOGLE_CLIENT_SECRET'] = '';
    const { providerConfigured } = await import('./env');
    expect(providerConfigured('google')).toBe(false);
    process.env['OAUTH_GOOGLE_CLIENT_SECRET'] = 'gsecret';
    vi.resetModules();
    const reloaded = await import('./env');
    expect(reloaded.providerConfigured('google')).toBe(true);
  });
});

describe('clientIdFor', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns the matching client id', async () => {
    process.env['OAUTH_GOOGLE_CLIENT_ID'] = 'gid';
    process.env['OAUTH_GITHUB_CLIENT_ID'] = 'hid';
    const { clientIdFor } = await import('./env');
    expect(clientIdFor('google')).toBe('gid');
    expect(clientIdFor('github')).toBe('hid');
  });
});
