import { isDev } from '@/lib/constants/config';

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type CacheControlOptions = {
  readonly maxAgeSeconds: number;
  readonly swrSeconds: number;
  readonly sharedMaxAgeSeconds?: number;
};

export function cacheControl({
  maxAgeSeconds,
  swrSeconds,
  sharedMaxAgeSeconds,
}: CacheControlOptions): string {
  const shared = sharedMaxAgeSeconds === undefined ? '' : `s-maxage=${sharedMaxAgeSeconds}, `;
  return `public, max-age=${maxAgeSeconds}, ${shared}stale-while-revalidate=${swrSeconds}`;
}

export function htmlCacheControl(isDevEnv: boolean): string {
  return isDevEnv
    ? 'no-store'
    : cacheControl({
        maxAgeSeconds: 1 * MINUTE,
        swrSeconds: 10 * MINUTE,
        sharedMaxAgeSeconds: 1 * DAY,
      });
}

export const CACHE_HTML = htmlCacheControl(isDev);
export const CACHE_SITEMAP = cacheControl({ maxAgeSeconds: 5 * MINUTE, swrSeconds: 5 * MINUTE });
export const CACHE_WELL_KNOWN = cacheControl({ maxAgeSeconds: 1 * DAY, swrSeconds: 1 * DAY });
export const CACHE_SEARCH = cacheControl({ maxAgeSeconds: 5 * MINUTE, swrSeconds: 1 * DAY });
export const CACHE_NONE = 'no-store';
