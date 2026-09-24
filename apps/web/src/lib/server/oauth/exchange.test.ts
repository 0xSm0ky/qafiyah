import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env['OAUTH_GOOGLE_CLIENT_ID'] = 'gid';
process.env['OAUTH_GOOGLE_CLIENT_SECRET'] = 'gsecret';
process.env['OAUTH_GITHUB_CLIENT_ID'] = 'hid';
process.env['OAUTH_GITHUB_CLIENT_SECRET'] = 'hsecret';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('exchangeCode for google', () => {
  beforeEach(() => fetchMock.mockReset());

  it('refuses an unverified email', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ access_token: 'tok' }))
      .mockResolvedValueOnce(json({ sub: 'g1', email: 'a@b.test', email_verified: false }));
    const { exchangeCode } = await import('./exchange');
    expect(await exchangeCode('google', 'code', 'https://q.test/cb')).toBeUndefined();
  });

  it('accepts a verified email and normalizes the profile', async () => {
    fetchMock.mockResolvedValueOnce(json({ access_token: 'tok' })).mockResolvedValueOnce(
      json({
        sub: 'g1',
        email: 'a@b.test',
        email_verified: true,
        name: 'A B',
        picture: 'https://x.test/a.png',
      })
    );
    const { exchangeCode } = await import('./exchange');
    expect(await exchangeCode('google', 'code', 'https://q.test/cb')).toEqual({
      provider: 'google',
      providerUid: 'g1',
      email: 'a@b.test',
      displayName: 'A B',
      avatarUrl: 'https://x.test/a.png',
    });
  });

  it('returns nothing when the token exchange fails', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: 'invalid_grant' }, 400));
    const { exchangeCode } = await import('./exchange');
    expect(await exchangeCode('google', 'bad', 'https://q.test/cb')).toBeUndefined();
  });
});

describe('exchangeCode for github', () => {
  beforeEach(() => fetchMock.mockReset());

  it('uses the primary verified email, not the first one', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ access_token: 'tok' }))
      .mockResolvedValueOnce(json({ id: 42, name: 'H U', avatar_url: 'https://x.test/h.png' }))
      .mockResolvedValueOnce(
        json([
          { email: 'old@b.test', primary: false, verified: true },
          { email: 'real@b.test', primary: true, verified: true },
        ])
      );
    const { exchangeCode } = await import('./exchange');
    const identity = await exchangeCode('github', 'code', 'https://q.test/cb');
    expect(identity?.email).toBe('real@b.test');
    expect(identity?.providerUid).toBe('42');
  });

  it('refuses when no primary verified email exists', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ access_token: 'tok' }))
      .mockResolvedValueOnce(json({ id: 42, name: 'H U', avatar_url: null }))
      .mockResolvedValueOnce(json([{ email: 'a@b.test', primary: true, verified: false }]));
    const { exchangeCode } = await import('./exchange');
    expect(await exchangeCode('github', 'code', 'https://q.test/cb')).toBeUndefined();
  });
});

describe('exchangeCode gap cases', () => {
  beforeEach(() => fetchMock.mockReset());

  it('returns nothing when a 200 token response carries an error body', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: 'invalid_grant' }));
    const { exchangeCode } = await import('./exchange');
    expect(await exchangeCode('google', 'code', 'https://q.test/cb')).toBeUndefined();
  });

  it('returns nothing when the google userinfo omits the sub', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ access_token: 'tok' }))
      .mockResolvedValueOnce(json({ email: 'a@b.test', email_verified: true }));
    const { exchangeCode } = await import('./exchange');
    expect(await exchangeCode('google', 'code', 'https://q.test/cb')).toBeUndefined();
  });

  it('returns nothing when the token fetch throws', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const { exchangeCode } = await import('./exchange');
    expect(await exchangeCode('github', 'code', 'https://q.test/cb')).toBeUndefined();
  });

  it('returns nothing when the github email list is not an array', async () => {
    fetchMock
      .mockResolvedValueOnce(json({ access_token: 'tok' }))
      .mockResolvedValueOnce(json({ id: 42 }))
      .mockResolvedValueOnce(json({ not: 'a list' }));
    const { exchangeCode } = await import('./exchange');
    expect(await exchangeCode('github', 'code', 'https://q.test/cb')).toBeUndefined();
  });
});
