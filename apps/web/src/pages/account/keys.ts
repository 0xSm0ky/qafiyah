import { accountFetch } from '@/lib/server/account-client';
import { CACHE_NONE } from '@/lib/server/cache';
import { setNewKeyCookie } from '@/lib/server/new-key-cookie';
import { resolveViewer } from '@/lib/server/session';

import type { APIRoute } from 'astro';

export const prerender = false;

function back(query = '', setCookie?: string): Response {
  const headers = new Headers({ Location: `/account${query}`, 'Cache-Control': CACHE_NONE });
  if (setCookie !== undefined) headers.set('Set-Cookie', setCookie);
  return new Response(null, { status: 302, headers });
}

export const POST: APIRoute = async ({ request }) => {
  const viewer = await resolveViewer(request.headers.get('cookie'));
  if (viewer === undefined) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/login', 'Cache-Control': CACHE_NONE },
    });
  }

  const form = await request.formData().catch(() => null);
  if (form === null) return back('?error=1');
  const action = form.get('action');

  if (action === 'create') {
    const created = await accountFetch<{ readonly value: string }>('/keys', {
      method: 'POST',
      body: JSON.stringify({ user_id: viewer.id, label: null }),
    });
    if (!created.ok || created.value === undefined) return back('?error=1');
    return back('', setNewKeyCookie(created.value.value));
  }

  if (action === 'revoke') {
    const rawId = form.get('key_id');
    if (typeof rawId !== 'string' || rawId === '') return back('?error=1');
    const keyId = Number(rawId);
    if (!Number.isInteger(keyId) || keyId <= 0) return back('?error=1');
    const revoked = await accountFetch('/keys/revoke', {
      method: 'POST',
      body: JSON.stringify({ user_id: viewer.id, key_id: keyId }),
    });
    if (!revoked.ok && revoked.status !== 404) return back('?error=1');
    return back();
  }

  return back('?error=1');
};
