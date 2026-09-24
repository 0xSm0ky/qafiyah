import type { apiServer } from './client';
import type { ClientPathsWithMethod, MethodResponse } from 'openapi-fetch';

export type Ok<P extends ClientPathsWithMethod<typeof apiServer, 'get'>> = MethodResponse<
  typeof apiServer,
  'get',
  P
>;
