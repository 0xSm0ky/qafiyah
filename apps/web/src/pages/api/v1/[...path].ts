import { proxyRequest } from '@/lib/api/proxy-handler';

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = (context) => proxyRequest(context);
