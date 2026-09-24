import { PROD_SITE_URL } from '@qafiyah/config';

import type { APIContext } from 'astro';

type FakeContextOptions = {
  readonly url?: string;
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly cookies?: Readonly<Record<string, string>>;
  readonly body?: BodyInit | null;
  readonly params?: Readonly<Record<string, string | undefined>>;
};

const redirect = (path: string, status = 302) =>
  new Response(null, { status, headers: { Location: path } });
const rewrite = (payload: unknown) => Promise.resolve(new Response(JSON.stringify(payload)));

export function fakeContext(options: FakeContextOptions = {}): APIContext {
  const url = new URL(options.url ?? `${PROD_SITE_URL}/`);
  const headers = new Headers(options.headers);
  const cookieHeader = Object.entries(options.cookies ?? {})
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
  if (cookieHeader !== '') headers.set('cookie', cookieHeader);

  const init: RequestInit = { method: options.method ?? 'GET', headers };
  if (options.body !== undefined) init.body = options.body;
  const request = new Request(url, init);
  const stored = new Map(Object.entries(options.cookies ?? {}));

  const cookies = {
    get: (name: string) => {
      const value = stored.get(name);
      return value === undefined ? undefined : { value, json: () => value };
    },
    has: (name: string) => stored.has(name),
    set: (name: string, value: string) => stored.set(name, value),
    delete: (name: string) => stored.delete(name),
  };

  const context = {
    url,
    params: options.params ?? {},
    request,
    cookies,
    redirect,
    rewrite,
  };
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a partial APIContext mock satisfies the wider Astro handler type
  return context as unknown as APIContext;
}
