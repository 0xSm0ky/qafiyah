import { defineEnv } from 'envin';
import * as v from 'valibot';

const _rawEnv =
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- import.meta carries Vite env types that are not visible to tsc here
  (import.meta as unknown as { env: Record<string, string | boolean | number | undefined> }).env;

const _env = defineEnv({
  clientPrefix: 'PUBLIC_',
  client: {
    PUBLIC_API_URL: v.optional(v.pipe(v.string(), v.url())),
  },
  env: _rawEnv,
});

export const env = {
  PUBLIC_API_URL: _env.PUBLIC_API_URL,
  DEV: _rawEnv['DEV'] === true,
};
