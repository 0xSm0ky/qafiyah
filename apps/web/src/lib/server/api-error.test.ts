import { describe, expect, it } from 'vitest';

import { isNotFoundStatus } from './api-error';

describe('isNotFoundStatus', () => {
  it('treats a missing resource (404) and a malformed slug (400) as not-found', () => {
    expect(isNotFoundStatus(404)).toBe(true);
    expect(isNotFoundStatus(400)).toBe(true);
  });

  it('does not swallow genuine server errors', () => {
    expect(isNotFoundStatus(500)).toBe(false);
    expect(isNotFoundStatus(503)).toBe(false);
  });

  it('does not treat a transport failure, which has no status, as not-found', () => {
    expect(isNotFoundStatus(null)).toBe(false);
  });
});
