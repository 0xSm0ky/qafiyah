import { err, ok } from 'neverthrow';

import {
  allChecks,
  expectOpenApiDocuments429,
  expectRealPage,
  headerIncludes,
  headerPresent,
} from '../checks';
import { OPENAPI_SPEC, POEMS_LIST, RANDOM_POEM } from '../target';

import type { Probe } from '../types';

export type Hammer = {
  readonly note: string;
  readonly url: string;
  readonly count: number;
};

export const rateLimitProbes: readonly Probe[] = [
  {
    url: POEMS_LIST,
    expect: 'ok',
    note: 'keyed /v1/poems returns a full page',
    check: expectRealPage,
  },
  {
    url: `${RANDOM_POEM}?option=slug`,
    expect: 'ok',
    note: 'keyed /v1/poems/random returns a real excerpt',
    check: (body) =>
      /^[a-zA-Z]{4}$/.test(body.trim()) ? ok(undefined) : err(`body "${body}" is not a slug`),
  },
  {
    url: OPENAPI_SPEC,
    expect: 'ok',
    note: 'openapi spec documents the 429 on list endpoints',
    check: expectOpenApiDocuments429,
  },
  {
    url: POEMS_LIST,
    expect: 'ok',
    note: 'unkeyed /v1/poems returns the same full page, publicly cacheable',
    prodOnly: true,
    unkeyed: true,
    check: allChecks(expectRealPage, headerIncludes('Cache-Control', 'public')),
  },
  {
    url: POEMS_LIST,
    expect: 'ok',
    note: 'unkeyed responses advertise the rate limit',
    prodOnly: true,
    unkeyed: true,
    check: allChecks(
      headerPresent('X-RateLimit-Limit'),
      headerPresent('X-RateLimit-Remaining'),
      headerPresent('X-RateLimit-Reset')
    ),
  },
];

export const hammers: readonly Hammer[] = [
  {
    note: 'unkeyed /v1/poems x8: no 5xx, every response valid, the quota visibly decrements',
    url: POEMS_LIST,
    count: 8,
  },
];
