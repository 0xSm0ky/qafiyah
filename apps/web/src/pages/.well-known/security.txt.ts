import { API_URL, SITE_URL } from '@/lib/constants/config';
import { SECURITY_TEMPLATE } from '@/lib/generated/well-known/well-known.gen';
import { CACHE_WELL_KNOWN } from '@/lib/server/cache';
import { SECURITY_EMAIL } from '@qafiyah/config';

import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const body = SECURITY_TEMPLATE.replaceAll('{EMAIL}', SECURITY_EMAIL)
    .replaceAll('{SITE}', SITE_URL)
    .replaceAll('{API}', API_URL);
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': CACHE_WELL_KNOWN,
    },
  });
};
