import { err, ok } from 'neverthrow';

import type { Check } from '../types';

export const isStatus = (wanted: number): Check => ({
  name: `status ${wanted}`,
  run: (_body, res) =>
    res.status === wanted ? ok(undefined) : err(`expected ${wanted}, got ${res.status}`),
});

export const isHealthy: Check = {
  name: 'non-5xx',
  run: (_body, res) => (res.status < 500 ? ok(undefined) : err(`got ${res.status}`)),
};

export const isNoStore: Check = {
  name: 'cache-control no-store',
  run: (_body, res) => {
    const value = res.headers.get('cache-control') ?? '';
    return value.includes('no-store')
      ? ok(undefined)
      : err(`cache-control "${value}" is not no-store`);
  },
};
