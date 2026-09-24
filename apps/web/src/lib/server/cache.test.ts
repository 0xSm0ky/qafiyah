import { describe, expect, it } from 'vitest';

import {
  CACHE_NONE,
  CACHE_SITEMAP,
  CACHE_WELL_KNOWN,
  cacheControl,
  htmlCacheControl,
} from './cache';

describe('cacheControl', () => {
  it('formats max-age + stale-while-revalidate', () => {
    expect(cacheControl({ maxAgeSeconds: 3600, swrSeconds: 86400 })).toBe(
      'public, max-age=3600, stale-while-revalidate=86400'
    );
  });
  it('adds s-maxage when a shared max-age is given', () => {
    expect(
      cacheControl({ maxAgeSeconds: 3600, swrSeconds: 86400, sharedMaxAgeSeconds: 604800 })
    ).toBe('public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400');
  });
});

describe('cache constants', () => {
  it('html pages cache 1m browser / 1d shared / SWR 10m in production', () => {
    expect(htmlCacheControl(false)).toBe(
      'public, max-age=60, s-maxage=86400, stale-while-revalidate=600'
    );
  });
  it('never caches html in dev, so edits are not hidden behind a hard reload', () => {
    expect(htmlCacheControl(true)).toBe(CACHE_NONE);
  });
  it('sitemap cache 5m / SWR 5m', () => {
    expect(CACHE_SITEMAP).toBe('public, max-age=300, stale-while-revalidate=300');
  });
  it('well-known files cache 1d / SWR 1d', () => {
    expect(CACHE_WELL_KNOWN).toBe('public, max-age=86400, stale-while-revalidate=86400');
  });
  it('404 is uncacheable', () => {
    expect(CACHE_NONE).toBe('no-store');
  });
});
