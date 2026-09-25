import createClient from 'openapi-fetch';

import { WEB_API_PROXY_PREFIX } from '@/lib/constants/config';
import { API_V1_PREFIX } from '@qafiyah/config';

import { serializeQuery } from './query-string';

import type { paths } from '@/lib/generated/openapi/schema.gen';

export const apiBrowser = createClient<paths>({
  baseUrl: `${WEB_API_PROXY_PREFIX}${API_V1_PREFIX}`,
  querySerializer: serializeQuery,
  cache: 'no-store',
});
