import { SITE_URL } from '@/lib/constants/config';
import { CACHE_SITEMAP } from '@/lib/server/cache';
import { apiServer } from '@/lib/server/client';
import { shardCount, sitemapIndexXml } from '@/lib/server/sitemap';
import { unwrap } from '@/lib/server/unwrap';
import { SITEMAP_POEMS_PER_SHARD } from '@qafiyah/config';

import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const total = await unwrap(() => apiServer.GET('/poems/count'));
  const poemShards = shardCount(total.total, SITEMAP_POEMS_PER_SHARD);
  const paths = [
    '/sitemap/root.xml',
    ...Array.from({ length: poemShards }, (_, i) => `/sitemap/poems/${i + 1}.xml`),
    '/sitemap/poets.xml',
    '/sitemap/taxonomies.xml',
  ];
  return new Response(sitemapIndexXml(SITE_URL, paths), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': CACHE_SITEMAP },
  });
};
