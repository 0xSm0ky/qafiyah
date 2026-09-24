import { err, ok, type Result } from 'neverthrow';

import { parseJsonObject } from '../checks';
import { POEM_DETAIL } from '../target';

import type { BodyCheck, Probe } from '../types';

type ExpectedNav = {
  readonly prev: string | null;
  readonly next: string | null;
};

function readNavSlug(
  data: Record<string, unknown>,
  key: 'prev' | 'next'
): string | null | undefined {
  if (!(key in data)) return null;
  const value = data[key];
  if (value === null) return null;
  if (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>)['slug'] === 'string'
  ) {
    return (value as Record<string, unknown>)['slug'] as string;
  }
  return undefined;
}

function expectPoemNav(expected: ExpectedNav): BodyCheck {
  return (body): Result<void, string> => {
    const parsed = parseJsonObject(body);
    if (parsed.isErr()) return err(parsed.error);
    const data = parsed.value['data'];
    if (data === null || typeof data !== 'object') return err('response has no data object');
    const container = data as Record<string, unknown>;
    for (const key of ['prev', 'next'] as const) {
      const actual = readNavSlug(container, key);
      const expectedSlug = expected[key];
      if (actual === undefined) {
        return err(`${key} is present but is not a valid nav reference`);
      }
      if (actual !== expectedSlug) {
        return err(
          `expected ${key} slug ${JSON.stringify(expectedSlug)}, got ${JSON.stringify(actual)}`
        );
      }
    }
    return ok(undefined);
  };
}

export const poemNavProbes: readonly Probe[] = [
  {
    url: POEM_DETAIL('UmlG'),
    expect: 'ok',
    note: 'first poem by id for a multi-poem poet: no prev, has next',
    check: expectPoemNav({ prev: null, next: 'pZhl' }),
  },
  {
    url: POEM_DETAIL('pZhl'),
    expect: 'ok',
    note: 'a middle poem: both prev and next present',
    check: expectPoemNav({ prev: 'UmlG', next: 'SOeo' }),
  },
  {
    url: POEM_DETAIL('bIQB'),
    expect: 'ok',
    note: 'last poem by id for a multi-poem poet: has prev, no next',
    check: expectPoemNav({ prev: 'uNUx', next: null }),
  },
  {
    url: POEM_DETAIL('rtNy'),
    expect: 'ok',
    note: 'a poet with exactly one poem: neither prev nor next',
    check: expectPoemNav({ prev: null, next: null }),
  },
];
