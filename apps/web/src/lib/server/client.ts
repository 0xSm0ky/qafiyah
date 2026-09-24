import createClient from 'openapi-fetch';

import { serializeQuery } from '@/lib/api/query-string';
import { SSR_FETCH_TIMEOUT_MS } from '@/lib/constants/config';
import { API_KEY_HEADER, API_V1_PREFIX } from '@qafiyah/config';

import { INTERNAL_API_KEY, INTERNAL_API_URL } from './env';

import type { paths } from '@/lib/generated/openapi/schema.gen';

const fetchWithTimeout = (input: Request): Promise<Response> =>
  fetch(
    new Request(input, {
      signal: AbortSignal.any([input.signal, AbortSignal.timeout(SSR_FETCH_TIMEOUT_MS)]),
    })
  );

export const apiServer = createClient<paths>({
  baseUrl: `${INTERNAL_API_URL}${API_V1_PREFIX}`,
  querySerializer: serializeQuery,
  headers: INTERNAL_API_KEY ? { [API_KEY_HEADER]: INTERNAL_API_KEY } : {},
  fetch: fetchWithTimeout,
});
