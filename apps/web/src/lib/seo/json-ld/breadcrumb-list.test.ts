import { describe, expect, it } from 'vitest';

import { buildBreadcrumbList } from './breadcrumb-list';

describe('buildBreadcrumbList', () => {
  it('absolutizes relative paths and derives position from index', () => {
    const doc = buildBreadcrumbList([
      { name: 'قافية', path: '/' },
      { name: 'الشعراء', path: '/poets' },
    ]);
    expect(doc.itemListElement.map((entry) => entry.position)).toEqual([1, 2]);
    expect(doc.itemListElement[0]?.item).toMatch(/^https?:\/\//);
  });

  it('leaves an already-absolute path unchanged', () => {
    const doc = buildBreadcrumbList([{ name: 'خارجي', path: 'https://example.com' }]);
    expect(doc.itemListElement[0]?.item).toBe('https://example.com');
  });

  it('throws when itemListElement would be empty', () => {
    expect(() => buildBreadcrumbList([])).toThrow();
  });
});
