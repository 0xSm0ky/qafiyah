import { headerIncludes, headerPresent } from '../checks/headers';
import { isNoStore, isStatus } from '../checks/status';
import { API, WEB } from '../target';

import type { Probe } from '../types';

const ALL = ['origin', 'stack', 'prod'] as const;
const STACK = ['stack', 'prod'] as const;

export const cachingProbes: readonly Probe[] = [
  {
    url: `${WEB}/`,
    note: 'homepage html is publicly cacheable',
    expect: 'ok',
    checks: [headerIncludes('Cache-Control', 'public')],
    surfaces: STACK,
  },
  {
    url: `${API}/v1/poems`,
    note: 'api json carries an etag',
    expect: 'ok',
    checks: [headerPresent('ETag')],
    surfaces: ALL,
  },
  {
    url: `${WEB}/login`,
    note: 'login is no-store',
    expect: 'ok',
    checks: [isNoStore],
    surfaces: ALL,
  },
  {
    url: `${WEB}/account`,
    note: 'account redirect is no-store',
    redirect: 'manual',
    checks: [isStatus(302), isNoStore],
    surfaces: ALL,
  },
  {
    url: `${WEB}/`,
    note: 'stack responses carry a cache status',
    expect: 'ok',
    checks: [headerPresent('x-cache-status')],
    surfaces: STACK,
  },
];
