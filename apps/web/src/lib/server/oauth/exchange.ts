import {
  OAUTH_GITHUB_CLIENT_ID,
  OAUTH_GITHUB_CLIENT_SECRET,
  OAUTH_GOOGLE_CLIENT_ID,
  OAUTH_GOOGLE_CLIENT_SECRET,
} from '@/lib/server/env';
import { PROVIDERS, type ProviderName } from '@/lib/server/oauth/providers';

const EXCHANGE_TIMEOUT_MS = 8000;

export type VerifiedIdentity = {
  readonly provider: ProviderName;
  readonly providerUid: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
};

type GoogleUser = {
  readonly sub?: string;
  readonly email?: string;
  readonly email_verified?: boolean;
  readonly name?: string;
  readonly picture?: string;
};

type GitHubUser = {
  readonly id?: number;
  readonly name?: string;
  readonly avatar_url?: string;
};

type GitHubEmail = {
  readonly email: string;
  readonly primary: boolean;
  readonly verified: boolean;
};

function credentials(provider: ProviderName): readonly [string, string] {
  return provider === 'google'
    ? [OAUTH_GOOGLE_CLIENT_ID, OAUTH_GOOGLE_CLIENT_SECRET]
    : [OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET];
}

async function accessToken(
  provider: ProviderName,
  code: string,
  redirectUri: string
): Promise<string | undefined> {
  const [clientId, clientSecret] = credentials(provider);
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });
  try {
    const response = await fetch(PROVIDERS[provider].token, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(EXCHANGE_TIMEOUT_MS),
    });
    if (!response.ok) return undefined;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the token endpoint's shape is the OAuth provider contract
    const parsed = (await response.json()) as { readonly access_token?: string };
    return parsed.access_token;
  } catch {
    return undefined;
  }
}

async function authed<T>(url: string, token: string): Promise<T | undefined> {
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json', authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(EXCHANGE_TIMEOUT_MS),
    });
    if (!response.ok) return undefined;
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the authed resource's shape is the OAuth provider contract
    return (await response.json()) as T;
  } catch {
    return undefined;
  }
}

async function googleIdentity(token: string): Promise<VerifiedIdentity | undefined> {
  const user = await authed<GoogleUser>('https://openidconnect.googleapis.com/v1/userinfo', token);
  if (user?.sub === undefined || user.email === undefined) return undefined;
  if (user.email_verified !== true) return undefined;
  return {
    provider: 'google',
    providerUid: user.sub,
    email: user.email,
    displayName: user.name ?? null,
    avatarUrl: user.picture ?? null,
  };
}

async function githubIdentity(token: string): Promise<VerifiedIdentity | undefined> {
  const user = await authed<GitHubUser>('https://api.github.com/user', token);
  if (user?.id === undefined) return undefined;
  const emails = await authed<unknown>('https://api.github.com/user/emails', token);
  if (!Array.isArray(emails)) return undefined;
  const primary = (emails as readonly GitHubEmail[]).find(
    (entry) => entry.primary && entry.verified
  );
  if (primary === undefined) return undefined;
  return {
    provider: 'github',
    providerUid: String(user.id),
    email: primary.email,
    displayName: user.name ?? null,
    avatarUrl: user.avatar_url ?? null,
  };
}

export async function exchangeCode(
  provider: ProviderName,
  code: string,
  redirectUri: string
): Promise<VerifiedIdentity | undefined> {
  const token = await accessToken(provider, code, redirectUri);
  if (token === undefined) return undefined;
  return provider === 'google' ? await googleIdentity(token) : await githubIdentity(token);
}
