import { INTERNAL_API_KEY, INTERNAL_API_URL } from '@/lib/server/env';
import { API_KEY_HEADER } from '@qafiyah/config';

const ACCOUNT_TIMEOUT_MS = 5000;

export type AccountResult<T> =
  | { readonly ok: true; readonly status: number; readonly value: T | undefined }
  | { readonly ok: false; readonly status: number | null };

export async function accountFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<AccountResult<T>> {
  const headers = new Headers(init.headers);
  headers.set(API_KEY_HEADER, INTERNAL_API_KEY);
  if (init.body !== undefined) headers.set('content-type', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${INTERNAL_API_URL}/account${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(ACCOUNT_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, status: null };
  }

  if (!response.ok) return { ok: false, status: response.status };
  if (response.status === 204) return { ok: true, status: 204, value: undefined };
  try {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the response contract is the account API's own typed surface
    return { ok: true, status: response.status, value: (await response.json()) as T };
  } catch {
    return { ok: false, status: response.status };
  }
}
