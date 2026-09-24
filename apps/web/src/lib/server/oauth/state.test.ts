import { describe, expect, it } from 'vitest';

import { mintState, verifyState } from './state';

const SECRET = 'test-secret';

describe('state', () => {
  it('verifies a value it minted', async () => {
    const value = await mintState(SECRET, 'nonce-1');
    expect(await verifyState(SECRET, value)).toBe(true);
  });

  it('refuses a tampered value', async () => {
    const value = await mintState(SECRET, 'nonce-1');
    expect(await verifyState(SECRET, `${value}x`)).toBe(false);
    expect(await verifyState(SECRET, value.replace(/^./u, 'z'))).toBe(false);
  });

  it('refuses a value minted with a different secret', async () => {
    const value = await mintState(SECRET, 'nonce-1');
    expect(await verifyState('other-secret', value)).toBe(false);
  });

  it('refuses malformed input', async () => {
    expect(await verifyState(SECRET, '')).toBe(false);
    expect(await verifyState(SECRET, 'no-dot-separator')).toBe(false);
  });
});
