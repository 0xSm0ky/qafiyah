import { describe, expect, it } from 'vitest';

import { viewerHintCookie } from './viewer-hint';

describe('viewerHintCookie', () => {
  it('sets the hint to 1 for the session lifetime when signed in', () => {
    const cookie = viewerHintCookie(true);
    expect(cookie).toContain('qaf_viewer=1');
    expect(cookie).toContain('Max-Age=2592000');
  });

  it('clears the hint when signed out', () => {
    const cookie = viewerHintCookie(false);
    expect(cookie).toContain('qaf_viewer=');
    expect(cookie).toContain('Max-Age=0');
  });

  it('is Secure and Lax but not HttpOnly, so client code can read it', () => {
    const cookie = viewerHintCookie(true);
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).not.toContain('HttpOnly');
  });
});
