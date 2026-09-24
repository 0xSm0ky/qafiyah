import { isDev } from '@/lib/constants/config';
import { PROD_SITE_URL } from '@qafiyah/config';

import type { ProviderName } from '@/lib/server/oauth/providers';

export const STATE_COOKIE = 'qaf_oauth_state';
const STATE_MAX_AGE_SECONDS = 600;

function siteOrigin(requestUrl: URL): string {
  return isDev ? requestUrl.origin : PROD_SITE_URL;
}

export function redirectUriFor(provider: ProviderName, requestUrl: URL): string {
  return `${siteOrigin(requestUrl)}/auth/callback/${provider}`;
}

export function stateCookieAttributes(): string {
  return `Path=/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=${STATE_MAX_AGE_SECONDS}`;
}

export function readStateCookie(cookieHeader: string | null): string | undefined {
  if (cookieHeader === null || cookieHeader === '') return undefined;
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === STATE_COOKIE) return rest.join('=') || undefined;
  }
  return undefined;
}
