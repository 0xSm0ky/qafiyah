import { describe, expect, it } from 'vitest';

import {
  clearNewKeyCookie,
  NEW_KEY_COOKIE,
  readNewKeyCookie,
  setNewKeyCookie,
} from './new-key-cookie';

const KEY = 'qaf_aBcD1234aBcD1234aBcD1234aBcD1234';

describe('setNewKeyCookie', () => {
  it('is HttpOnly, Secure, Lax, and scoped to /account', () => {
    const cookie = setNewKeyCookie(KEY);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/account');
  });

  it('expires in two minutes so a stale key cannot linger', () => {
    expect(setNewKeyCookie(KEY)).toContain('Max-Age=120');
  });
});

describe('readNewKeyCookie', () => {
  it('round trips the key', () => {
    const cookie = setNewKeyCookie(KEY);
    const header = cookie.slice(0, cookie.indexOf(';'));
    expect(readNewKeyCookie(header)).toBe(KEY);
  });

  it('finds it among other cookies', () => {
    expect(readNewKeyCookie(`theme=dark; ${NEW_KEY_COOKIE}=${KEY}; qaf_session=x`)).toBe(KEY);
  });

  it('returns nothing when absent, empty, or cleared', () => {
    expect(readNewKeyCookie('theme=dark')).toBeUndefined();
    expect(readNewKeyCookie(null)).toBeUndefined();
    expect(readNewKeyCookie(`${NEW_KEY_COOKIE}=`)).toBeUndefined();
  });

  it('is not fooled by a cookie whose name merely ends with the same suffix', () => {
    expect(readNewKeyCookie(`not_${NEW_KEY_COOKIE}=${KEY}`)).toBeUndefined();
  });

  it('returns undefined rather than throwing on a malformed percent sequence', () => {
    expect(readNewKeyCookie(`${NEW_KEY_COOKIE}=%zz`)).toBeUndefined();
  });
});

describe('clearNewKeyCookie', () => {
  it('expires the cookie on the same path it was set', () => {
    expect(clearNewKeyCookie()).toContain('Max-Age=0');
    expect(clearNewKeyCookie()).toContain('Path=/account');
  });
});
