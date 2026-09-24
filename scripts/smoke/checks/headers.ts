import { err, ok } from 'neverthrow';

import type { Check } from '../types';

export const headerIncludes = (name: string, needle: string): Check => ({
  name: `${name} includes ${needle}`,
  run: (_body, res) => {
    const value = res.headers.get(name) ?? '';
    return value.includes(needle)
      ? ok(undefined)
      : err(`${name} "${value}" does not include "${needle}"`);
  },
});

export const headerPresent = (name: string): Check => ({
  name: `${name} present`,
  run: (_body, res) => (res.headers.get(name) === null ? err(`${name} is missing`) : ok(undefined)),
});
