import { isWellFormedXml } from '../checks/body';
import { isStatus } from '../checks/status';
import { WEB } from '../target';

import type { Probe } from '../types';

const ALL = ['origin', 'stack', 'prod'] as const;

export const sitemapProbes: readonly Probe[] = [
  {
    url: `${WEB}/sitemap-index.xml`,
    note: 'sitemap index is well-formed',
    expect: 'ok',
    checks: [isWellFormedXml],
    surfaces: ALL,
  },
  {
    url: `${WEB}/sitemap/root.xml`,
    note: 'root sitemap is well-formed',
    expect: 'ok',
    checks: [isWellFormedXml],
    surfaces: ALL,
  },
  {
    url: `${WEB}/sitemap/poems/1.xml`,
    note: 'first poem shard is well-formed',
    expect: 'ok',
    checks: [isWellFormedXml],
    surfaces: ALL,
  },
  {
    url: `${WEB}/sitemap/poets.xml`,
    note: 'poets sitemap is well-formed',
    expect: 'ok',
    checks: [isWellFormedXml],
    surfaces: ALL,
  },
  {
    url: `${WEB}/sitemap/taxonomies.xml`,
    note: 'taxonomies sitemap is well-formed',
    expect: 'ok',
    checks: [isWellFormedXml],
    surfaces: ALL,
  },
  {
    url: `${WEB}/sitemap/poems/999999.xml`,
    note: 'out-of-range shard is 404',
    checks: [isStatus(404)],
    surfaces: ALL,
  },
];
