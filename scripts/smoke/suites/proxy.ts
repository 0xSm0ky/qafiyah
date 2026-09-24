import { err, ok } from 'neverthrow';

import { expectJsonObject } from '../checks/body';
import { isNoStore, isStatus } from '../checks/status';
import { WEB } from '../target';

import type { Check, Probe } from '../types';

const ALL = ['origin', 'stack', 'prod'] as const;

const isPoemSlug: Check = {
  name: '4-letter poem slug',
  run: (body) =>
    /^[a-zA-Z]{4}$/.test(body.trim()) ? ok(undefined) : err(`body "${body}" is not a slug`),
};

export const proxyProbes: readonly Probe[] = [
  {
    url: `${WEB}/api/v1/search?q=%D8%AD%D8%A8`,
    note: 'proxy search passthrough',
    expect: 'ok',
    checks: [expectJsonObject],
    surfaces: ALL,
  },
  {
    url: `${WEB}/api/v1/poems/random`,
    note: 'proxy random poem passthrough',
    expect: 'ok',
    checks: [isPoemSlug],
    surfaces: ALL,
  },
  {
    url: `${WEB}/api/v1/poems`,
    note: 'blocked proxy path is 404',
    checks: [isNoStore, isStatus(404)],
    surfaces: ALL,
  },
  {
    url: `${WEB}/api/v1/Search?q=x`,
    note: 'uppercased proxy path is blocked',
    checks: [isStatus(404)],
    surfaces: ALL,
  },
];
