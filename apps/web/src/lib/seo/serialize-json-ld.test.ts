import { describe, expect, it } from 'vitest';

import { serializeJsonLd, type AnyJsonLdDoc } from './serialize-json-ld';

const doc = (name: string): AnyJsonLdDoc =>
  ({ '@type': 'WebPage', name }) as unknown as AnyJsonLdDoc;

describe('serializeJsonLd', () => {
  it('escapes a closing script tag so the JSON-LD cannot break out of the script element', () => {
    const out = serializeJsonLd(doc('<script>alert(1)</script>'));
    expect(out).toContain('\\u003cscript>');
    expect(out).toContain('\\u003c/script>');
    expect(out).not.toContain('<script>');
  });

  it('escapes the U+2028 and U+2029 line separators that break JavaScript string literals', () => {
    const out = serializeJsonLd(doc('a\u2028b\u2029c'));
    expect(out).toContain('\\u2028');
    expect(out).toContain('\\u2029');
    expect(out).not.toContain('\u2028');
    expect(out).not.toContain('\u2029');
  });

  it('leaves an already-safe document otherwise intact', () => {
    expect(serializeJsonLd(doc('عادي'))).toContain('"name":"عادي"');
  });
});
