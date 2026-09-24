import { resolveViewer } from '@/lib/server/session';
import { viewerResponse } from '@/lib/server/viewer-response';

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request }) =>
  viewerResponse(await resolveViewer(request.headers.get('cookie')));
