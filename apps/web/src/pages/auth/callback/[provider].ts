import { SESSION_MAX_AGE_SECONDS } from '@/lib/constants/config';
import { accountFetch } from '@/lib/server/account-client';
import { CACHE_NONE } from '@/lib/server/cache';
import { SESSION_STATE_SECRET } from '@/lib/server/env';
import { exchangeCode } from '@/lib/server/oauth/exchange';
import { resolveProvider } from '@/lib/server/oauth/providers';
import { readStateCookie, redirectUriFor, STATE_COOKIE } from '@/lib/server/oauth/redirect';
import { verifyState } from '@/lib/server/oauth/state';
import { SESSION_COOKIE, sessionCookieAttributes } from '@/lib/server/session';
import { viewerHintCookie } from '@/lib/viewer-hint';

import type { APIRoute } from 'astro';

export const prerender = false;

function fail(): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/login?error=1',
      'Cache-Control': CACHE_NONE,
      'Set-Cookie': `${STATE_COOKIE}=; Path=/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
    },
  });
}

export const GET: APIRoute = async ({ params, request, url }) => {
  const provider = resolveProvider(params['provider']);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = readStateCookie(request.headers.get('cookie'));

  if (provider === undefined || code === null || state === null) return fail();
  if (cookieState === undefined || cookieState !== state) return fail();
  if (!(await verifyState(SESSION_STATE_SECRET, state))) return fail();

  const identity = await exchangeCode(provider, code, redirectUriFor(provider, url));
  if (identity === undefined) return fail();

  const profile = await accountFetch<{ readonly id: number }>('/users', {
    method: 'POST',
    body: JSON.stringify({
      provider: identity.provider,
      provider_uid: identity.providerUid,
      email: identity.email,
      display_name: identity.displayName,
      avatar_url: identity.avatarUrl,
    }),
  });
  if (!profile.ok || profile.value === undefined) return fail();

  const session = await accountFetch<{ readonly id: string }>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ user_id: profile.value.id }),
  });
  if (!session.ok || session.value === undefined) return fail();

  const headers = new Headers({ Location: '/account', 'Cache-Control': CACHE_NONE });
  headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=${session.value.id}; ${sessionCookieAttributes(SESSION_MAX_AGE_SECONDS)}`
  );
  headers.append('Set-Cookie', viewerHintCookie(true));
  headers.append(
    'Set-Cookie',
    `${STATE_COOKIE}=; Path=/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
  return new Response(null, { status: 302, headers });
};
