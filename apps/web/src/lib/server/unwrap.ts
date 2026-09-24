import {
  SSR_NETWORK_RETRY_COUNT,
  SSR_RETRY_BASE_DELAY_MS,
  SSR_RETRY_MAX_DELAY_MS,
} from '@/lib/constants/config';
import { isTransientNetworkError } from '@/lib/observability/is-transient-network-error';

import { isNotFoundStatus } from './api-error';

type FetchResult<D> = {
  readonly data?: D | undefined;
  readonly error?: unknown;
  readonly response: Response;
};

type Attempt<D> = {
  readonly data?: D | undefined;
  readonly error?: unknown;
  readonly status: number | null;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

async function attempt<D>(factory: () => Promise<FetchResult<D>>): Promise<Attempt<D>> {
  try {
    const { data, error, response } = await factory();
    return { data, error, status: response.status };
  } catch (cause) {
    return { error: cause, status: null };
  }
}

export async function safeCall<D>(factory: () => Promise<FetchResult<D>>): Promise<Attempt<D>> {
  let result = await attempt(factory);
  for (
    let tries = 0;
    result.status === null &&
    result.error !== undefined &&
    isTransientNetworkError(result.error) &&
    tries < SSR_NETWORK_RETRY_COUNT;
    tries += 1
  ) {
    await delay(Math.min(SSR_RETRY_BASE_DELAY_MS * 2 ** tries, SSR_RETRY_MAX_DELAY_MS));
    result = await attempt(factory);
  }
  return result;
}

export function apiFailure(result: Attempt<unknown>): Error {
  if (result.error instanceof Error) return result.error;
  return new Error(`API request failed with status ${result.status ?? 'no response'}`);
}

export async function unwrap<E extends { readonly data: unknown }>(
  factory: () => Promise<FetchResult<E>>
): Promise<E['data']> {
  const result = await safeCall(factory);
  if (result.data === undefined) throw apiFailure(result);
  return result.data.data;
}

export async function getOrNull<E extends { readonly data: unknown }>(
  factory: () => Promise<FetchResult<E>>
): Promise<E['data'] | null> {
  const result = await safeCall(factory);
  if (result.data === undefined) {
    if (isNotFoundStatus(result.status)) return null;
    throw apiFailure(result);
  }
  return result.data.data;
}
