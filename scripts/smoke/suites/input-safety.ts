import { isHealthy, isStatus } from '../checks/status';
import { WEB } from '../target';

import type { Probe } from '../types';

const STACK = ['stack', 'prod'] as const;

export const inputSafetyProbes: readonly Probe[] = [
  {
    url: `${WEB}/${'a'.repeat(256)}`,
    note: 'a path segment past NAME_MAX is 414',
    checks: [isStatus(414)],
    surfaces: STACK,
  },
  {
    url: `${WEB}/%2e%2e/%2e%2e/%2e%2e/etc/passwd`,
    note: 'encoded traversal does not escape',
    checks: [isHealthy],
    surfaces: STACK,
  },
  {
    url: `${WEB}//poets`,
    note: 'leading double slash is handled',
    checks: [isHealthy],
    surfaces: STACK,
  },
  {
    url: `${WEB}/poets?q=%0d%0aSet-Cookie:x`,
    note: 'crlf in query is neutralized',
    checks: [isHealthy],
    surfaces: STACK,
  },
  {
    url: `${WEB}/poets?q=%00`,
    note: 'embedded nul is handled',
    checks: [isHealthy],
    surfaces: STACK,
  },
];
