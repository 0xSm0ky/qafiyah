import { err, ok, type Result, ResultAsync } from 'neverthrow';

import { TARGET } from './target';

const STARTUP_TIMEOUT_MS = 120_000;
export const REQUEST_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 250;
const POLL_FETCH_MS = 500;
export const SHUTDOWN_GRACE_MS = 5_000;
const PROD_MAX_ATTEMPTS = 3;
const RETRY_BACKOFF_MS = 300;

export type FetchError = {
  readonly kind: 'network' | 'timeout';
  readonly message: string;
};

const toFetchError = (cause: unknown): FetchError => {
  const isAbort = cause instanceof DOMException && cause.name === 'AbortError';
  return {
    kind: isAbort ? 'timeout' : 'network',
    message: cause instanceof Error ? cause.message : String(cause),
  };
};

async function tryFetch(
  url: string,
  timeoutMs: number,
  init?: RequestInit
): Promise<Result<Response, FetchError>> {
  return await ResultAsync.fromPromise(
    fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) }),
    toFetchError
  );
}

export type WireResponse = {
  readonly status: number;
  readonly body: string;
  readonly res: Response;
};

export async function fetchWire(
  url: string,
  timeoutMs: number,
  init?: RequestInit
): Promise<Result<WireResponse, FetchError>> {
  const fetchResult = await tryFetch(url, timeoutMs, init);
  if (fetchResult.isErr()) return err(fetchResult.error);
  const res = fetchResult.value;
  const isHead = (init?.method ?? 'GET').toUpperCase() === 'HEAD';
  const bodyResult = await ResultAsync.fromPromise(
    isHead ? Promise.resolve('') : res.text(),
    toFetchError
  );
  if (bodyResult.isErr()) return err(bodyResult.error);
  return ok({ status: res.status, body: bodyResult.value, res });
}

const isTransient = (result: Result<WireResponse, FetchError>): boolean =>
  result.match(
    (wire) => wire.status >= 500,
    () => true
  );

export async function fetchWireResilient(
  url: string,
  timeoutMs: number,
  init?: RequestInit
): Promise<Result<WireResponse, FetchError>> {
  const maxAttempts = TARGET.manageServer ? 1 : PROD_MAX_ATTEMPTS;
  let last = await fetchWire(url, timeoutMs, init);
  for (let attempt = 2; attempt <= maxAttempts && isTransient(last); attempt++) {
    await Bun.sleep(RETRY_BACKOFF_MS * (attempt - 1));
    last = await fetchWire(url, timeoutMs, init);
  }
  return last;
}

export async function pool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = Array.from({ length: items.length });
  let next = 0;
  const width = Math.max(1, Math.min(concurrency, items.length || 1));
  const run = async (): Promise<void> => {
    for (let i = next++; i < items.length; i = next++) {
      const item = items[i];
      if (item !== undefined) results[i] = await worker(item, i);
    }
  };
  await Promise.all(Array.from({ length: width }, run));
  return results;
}

type ServerReady = { readonly kind: 'ready' };
export type ServerUnready = { readonly kind: 'timeout'; readonly lastError: FetchError | null };

export async function waitForServer(url: string): Promise<Result<ServerReady, ServerUnready>> {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let lastError: FetchError | null = null;
  while (Date.now() < deadline) {
    const fetchResult = await fetchWire(url, POLL_FETCH_MS);
    if (fetchResult.isOk()) {
      if (fetchResult.value.status < 500) return ok({ kind: 'ready' });
      lastError = { kind: 'network', message: `HTTP ${fetchResult.value.status}` };
    } else {
      lastError = fetchResult.error;
    }
    await Bun.sleep(POLL_INTERVAL_MS);
  }
  return err({ kind: 'timeout', lastError });
}
