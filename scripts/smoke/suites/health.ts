import { isStatus } from '../checks/status';
import { API, WEB } from '../target';

import type { Probe } from '../types';

const ALL = ['origin', 'stack', 'prod'] as const;

export const healthProbes: readonly Probe[] = [
  {
    url: `${API}/healthz`,
    note: 'api healthz is 200',
    host: 'api',
    checks: [isStatus(200)],
    surfaces: ALL,
  },
  {
    url: `${WEB}/healthz`,
    note: 'web healthz through nginx',
    host: 'web',
    checks: [isStatus(200)],
    surfaces: ['stack', 'prod'],
  },
];
