import { accountFetch } from '@/lib/server/account-client';
import { CACHE_NONE } from '@/lib/server/cache';
import { readSessionId, SESSION_COOKIE } from '@/lib/server/session';
import { viewerHintCookie } from '@/lib/viewer-hint';

import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const id = readSessionId(request.headers.get('cookie'));
  if (id !== undefined) {
    await accountFetch(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
  const headers = new Headers({ Location: '/', 'Cache-Control': CACHE_NONE });
  headers.append(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
  headers.append('Set-Cookie', viewerHintCookie(false));
  return new Response(null, { status: 302, headers });
};
