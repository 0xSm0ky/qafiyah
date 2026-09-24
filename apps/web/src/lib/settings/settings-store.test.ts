import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_SETTINGS } from './settings-schema';

function windowWithBlockedStorage() {
  return {
    get localStorage(): Storage {
      throw new DOMException(
        "Failed to read the 'localStorage' property from 'Window': Access is denied for this document.",
        'SecurityError'
      );
    },
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

async function freshStore() {
  vi.resetModules();
  return await import('./settings-store');
}

describe('the settings store when the browser blocks storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reads the default settings instead of throwing', async () => {
    vi.stubGlobal('window', windowWithBlockedStorage());
    const { getSettings } = await freshStore();
    expect(getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps a change for the rest of the visit without persisting it', async () => {
    vi.stubGlobal('window', windowWithBlockedStorage());
    const { getSettings, updateSettings } = await freshStore();
    updateSettings({ theme: 'dark' });
    expect(getSettings().theme).toBe('dark');
  });
});
