import { describe, expect, it } from 'vitest';

import { isTransientNetworkError } from './is-transient-network-error';

describe('isTransientNetworkError', () => {
  it('recognizes an abort and a timeout', () => {
    expect(isTransientNetworkError(new DOMException('aborted', 'AbortError'))).toBe(true);
    expect(isTransientNetworkError(new DOMException('timed out', 'TimeoutError'))).toBe(true);
  });

  it('recognizes Bun connection error codes', () => {
    expect(
      isTransientNetworkError(
        Object.assign(new Error('Unable to connect.'), { code: 'ConnectionRefused' })
      )
    ).toBe(true);
    expect(isTransientNetworkError(Object.assign(new Error('x'), { code: 'ETIMEDOUT' }))).toBe(
      true
    );
  });

  it('recognizes the cross-runtime failure messages', () => {
    expect(isTransientNetworkError(new Error('Failed to fetch'))).toBe(true);
    expect(
      isTransientNetworkError(new TypeError('NetworkError when attempting to fetch resource'))
    ).toBe(true);
  });

  it('does not treat a plain application error as transient', () => {
    expect(isTransientNetworkError(new Error('business logic failed'))).toBe(false);
    expect(isTransientNetworkError('a string')).toBe(false);
    expect(isTransientNetworkError(undefined)).toBe(false);
  });
});
