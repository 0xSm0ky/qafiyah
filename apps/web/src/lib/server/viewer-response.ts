import { CACHE_NONE } from '@/lib/server/cache';

import type { Profile } from '@/lib/server/session';

export type ViewerPayload = {
  readonly displayName: string | null;
  readonly avatarUrl: string | null;
};

export function viewerResponse(viewer: Profile | undefined): Response {
  if (viewer === undefined) {
    return new Response(null, { status: 204, headers: { 'Cache-Control': CACHE_NONE } });
  }
  const payload: ViewerPayload = {
    displayName: viewer.displayName ?? viewer.email,
    avatarUrl: viewer.avatarUrl,
  };
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json', 'Cache-Control': CACHE_NONE },
  });
}
