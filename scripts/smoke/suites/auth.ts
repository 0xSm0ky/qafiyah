import { isHealthy, isNoStore, isStatus } from '../checks/status';
import { WEB } from '../target';

import type { Probe } from '../types';

const ALL = ['origin', 'stack', 'prod'] as const;

export const authProbes: readonly Probe[] = [
  {
    url: `${WEB}/login`,
    note: 'login is 200 and uncacheable',
    expect: 'ok',
    checks: [isNoStore],
    surfaces: ALL,
  },
  {
    url: `${WEB}/account`,
    note: 'account redirects to login',
    redirect: 'manual',
    checks: [isStatus(302)],
    surfaces: ALL,
  },
  {
    url: `${WEB}/api/me`,
    note: 'anonymous me is 204',
    checks: [isStatus(204), isNoStore],
    surfaces: ALL,
  },
  {
    url: `${WEB}/auth/google`,
    note: 'google 404 when unconfigured, 302 when configured',
    redirect: 'manual',
    checks: [isHealthy],
    surfaces: ['stack'],
  },
  {
    url: `${WEB}/auth/callback/google`,
    note: 'callback without state redirects',
    redirect: 'manual',
    checks: [isStatus(302)],
    surfaces: ALL,
  },
  {
    url: `${WEB}/auth/logout`,
    note: 'logout without origin is rejected',
    method: 'POST',
    checks: [isStatus(403)],
    surfaces: ALL,
  },
];
