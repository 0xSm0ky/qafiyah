import { API_URL, SITE_URL } from '@/lib/constants/config';
import { LLMS_WEB_TEMPLATE } from '@/lib/generated/well-known/well-known.gen';
import { CACHE_WELL_KNOWN } from '@/lib/server/cache';

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const body = LLMS_WEB_TEMPLATE.replaceAll('{SITE}', SITE_URL).replaceAll('{API}', API_URL);
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': CACHE_WELL_KNOWN,
    },
  });
};
