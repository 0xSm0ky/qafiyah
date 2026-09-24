import { CACHE_NONE } from '@/lib/server/cache';
import { clientIdFor, providerConfigured, SESSION_STATE_SECRET } from '@/lib/server/env';
import { authorizeUrl, resolveProvider } from '@/lib/server/oauth/providers';
import { redirectUriFor, STATE_COOKIE, stateCookieAttributes } from '@/lib/server/oauth/redirect';
import { mintState } from '@/lib/server/oauth/state';

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, url }) => {
  const provider = resolveProvider(params['provider']);
  if (provider === undefined || !providerConfigured(provider)) {
    return new Response(null, { status: 404, headers: { 'Cache-Control': CACHE_NONE } });
  }

  const nonce = crypto.randomUUID();
  const state = await mintState(SESSION_STATE_SECRET, nonce);
  const target = authorizeUrl(
    provider,
    state,
    redirectUriFor(provider, url),
    clientIdFor(provider)
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: target,
      'Cache-Control': CACHE_NONE,
      'Set-Cookie': `${STATE_COOKIE}=${state}; ${stateCookieAttributes()}`,
    },
  });
};
