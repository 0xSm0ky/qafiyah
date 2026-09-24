import { notContainsText } from '../checks/body';
import { API, WEB } from '../target';

import type { Probe } from '../types';

const ALL = ['origin', 'stack', 'prod'] as const;

export const wellKnownProbes: readonly Probe[] = [
  {
    url: `${WEB}/robots.txt`,
    note: 'web robots.txt has no placeholder',
    host: 'web',
    expect: 'ok',
    checks: [notContainsText('{SITE}')],
    surfaces: ALL,
  },
  {
    url: `${WEB}/llms.txt`,
    note: 'web llms.txt has no placeholder',
    host: 'web',
    expect: 'ok',
    checks: [notContainsText('{SITE}')],
    surfaces: ALL,
  },
  {
    url: `${WEB}/.well-known/security.txt`,
    note: 'web security.txt has no placeholder',
    host: 'web',
    expect: 'ok',
    checks: [notContainsText('{EMAIL}')],
    surfaces: ALL,
  },
  {
    url: `${API}/robots.txt`,
    note: 'api robots.txt has no placeholder',
    host: 'api',
    expect: 'ok',
    checks: [notContainsText('{API}')],
    surfaces: ALL,
  },
  {
    url: `${API}/llms.txt`,
    note: 'api llms.txt has no placeholder',
    host: 'api',
    expect: 'ok',
    checks: [notContainsText('{BASE}')],
    surfaces: ALL,
  },
  {
    url: `${API}/.well-known/security.txt`,
    note: 'api security.txt has no placeholder',
    host: 'api',
    expect: 'ok',
    checks: [notContainsText('{EMAIL}')],
    surfaces: ALL,
  },
];
