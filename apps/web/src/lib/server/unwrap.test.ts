import { describe, expect, it, vi } from 'vitest';

import { SSR_NETWORK_RETRY_COUNT } from '@/lib/constants/config';
import { isTransientNetworkError } from '@/lib/observability/is-transient-network-error';
import { failure, ok } from '@/test/api-results';

import { getOrNull, unwrap } from './unwrap';

describe('unwrap', () => {
  it('returns the inner data on success', async () => {
    expect(await unwrap(() => Promise.resolve(ok({ data: [1, 2, 3] })))).toEqual([1, 2, 3]);
  });

  it('throws on any error status', async () => {
    await expect(unwrap(() => Promise.resolve(failure(500)))).rejects.toThrow();
  });
});

describe('getOrNull', () => {
  it('returns the inner data on success', async () => {
    expect(await getOrNull(() => Promise.resolve(ok({ data: { name: 'x' } })))).toEqual({
      name: 'x',
    });
  });

  it('returns null on a 404', async () => {
    expect(await getOrNull(() => Promise.resolve(failure(404)))).toBeNull();
  });

  it('returns null on a 400 (a malformed slug is a missing resource, not a 500)', async () => {
    expect(await getOrNull(() => Promise.resolve(failure(400)))).toBeNull();
  });

  it('throws on a 500 (a genuine server error is not a missing resource)', async () => {
    await expect(getOrNull(() => Promise.resolve(failure(500)))).rejects.toThrow();
  });

  it('rethrows when the request never got an answer', async () => {
    await expect(getOrNull(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
  });
});

describe('transient retry', () => {
  const bunConnectionError = (): Error =>
    Object.assign(new Error('Unable to connect.'), {
      code: 'ConnectionRefused',
    });

  it('retries a transient connection blip and resolves once the api recovers', async () => {
    const factory = vi
      .fn<() => Promise<ReturnType<typeof ok<{ data: string }>>>>()
      .mockRejectedValueOnce(bunConnectionError())
      .mockResolvedValueOnce(ok({ data: 'ok' }));
    expect(await unwrap(factory)).toBe('ok');
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('gives up after exhausting retries and rethrows the transient error', async () => {
    const factory = vi
      .fn<() => Promise<ReturnType<typeof ok<{ data: string }>>>>()
      .mockRejectedValue(bunConnectionError());
    await expect(unwrap(factory)).rejects.toThrow('Unable to connect.');
    expect(factory).toHaveBeenCalledTimes(3);
  });

  it('does not retry an HTTP error, which carries a status', async () => {
    const factory = vi
      .fn<() => Promise<ReturnType<typeof failure>>>()
      .mockResolvedValue(failure(500));
    await expect(unwrap(factory)).rejects.toThrow();
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

describe('safeCall retry coverage', () => {
  it('retries an AbortError and a TimeoutError as transient', async () => {
    for (const name of ['AbortError', 'TimeoutError'] as const) {
      const factory = vi
        .fn<() => Promise<ReturnType<typeof ok<{ data: string }>>>>()
        .mockRejectedValueOnce(new DOMException('x', name))
        .mockResolvedValueOnce(ok({ data: 'ok' }));
      expect(await unwrap(factory)).toBe('ok');
      expect(factory).toHaveBeenCalledTimes(2);
    }
  });

  it('never retries more than the real retry constant plus the first attempt', async () => {
    const factory = vi
      .fn<() => Promise<ReturnType<typeof ok<{ data: string }>>>>()
      .mockRejectedValue(
        Object.assign(new Error('Unable to connect.'), { code: 'ConnectionRefused' })
      );
    await expect(unwrap(factory)).rejects.toThrow();
    expect(factory).toHaveBeenCalledTimes(1 + SSR_NETWORK_RETRY_COUNT);
  });

  it('classifies an abort and a timeout as transient in the shared predicate', () => {
    expect(isTransientNetworkError(new DOMException('x', 'AbortError'))).toBe(true);
    expect(isTransientNetworkError(new DOMException('x', 'TimeoutError'))).toBe(true);
  });
});
