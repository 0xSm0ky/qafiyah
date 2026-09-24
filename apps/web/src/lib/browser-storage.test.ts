import { afterEach, describe, expect, it, vi } from 'vitest';

import { browserStorage } from './browser-storage';

describe('browserStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the window storage when the browser allows it', () => {
    const storage = { getItem: () => null };
    vi.stubGlobal('window', { localStorage: storage });
    expect(browserStorage()).toBe(storage);
  });

  it('returns nothing when reading localStorage throws a SecurityError', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new DOMException('Access is denied for this document.', 'SecurityError');
      },
    });
    expect(browserStorage()).toBeUndefined();
  });

  it('returns nothing on the server, where there is no window', () => {
    expect(browserStorage()).toBeUndefined();
  });
});
