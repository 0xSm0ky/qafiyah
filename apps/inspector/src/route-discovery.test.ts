import { describe, expect, it } from 'bun:test';

import { shapesFromPageFiles } from './route-discovery';

describe('shapesFromPageFiles', () => {
  it('maps root index.astro to the "/" shape', () => {
    const shapes = shapesFromPageFiles(['index.astro']);
    expect(shapes).toEqual([{ shape: '/', isDynamic: false, staticPath: '/', pattern: null }]);
  });

  it('maps a directory index.astro to its directory path', () => {
    const shapes = shapesFromPageFiles(['poets/index.astro']);
    expect(shapes).toEqual([
      { shape: 'poets', isDynamic: false, staticPath: '/poets', pattern: null },
    ]);
  });

  it('maps a numeric static page like 404.astro', () => {
    const shapes = shapesFromPageFiles(['404.astro']);
    expect(shapes).toEqual([{ shape: '404', isDynamic: false, staticPath: '/404', pattern: null }]);
  });

  it('excludes 500.astro', () => {
    expect(shapesFromPageFiles(['500.astro'])).toEqual([]);
  });

  it('excludes non-astro pages (feeds, redirects, well-known files)', () => {
    const files = [
      'llms.txt.ts',
      'robots.txt.ts',
      'sitemap-index.xml.ts',
      'sitemap/root.xml.ts',
      'sitemap/poems/[page].xml.ts',
      'poems/random.ts',
      '.well-known/security.txt.ts',
    ];
    expect(shapesFromPageFiles(files)).toEqual([]);
  });

  it('maps a dynamic [slug].astro to a shape with a matching regex', () => {
    const shapes = shapesFromPageFiles(['poets/[slug].astro']);
    expect(shapes).toHaveLength(1);
    const [shape] = shapes;
    expect(shape).toMatchObject({ shape: 'poets/[slug]', isDynamic: true, staticPath: null });
    expect(shape?.pattern?.test('/poets/abu-tayyib-al-mutanabbi')).toBe(true);
    expect(shape?.pattern?.test('/poets/abu-tayyib-al-mutanabbi/extra')).toBe(false);
    expect(shape?.pattern?.test('/poets')).toBe(false);
  });

  it("excludes a sibling static route's exact path from a dynamic shape's pattern", () => {
    const shapes = shapesFromPageFiles(['poems/[slug].astro', 'poems/random.ts']);
    expect(shapes).toHaveLength(1);
    const [shape] = shapes;
    expect(shape?.pattern?.test('/poems/random')).toBe(false);
    expect(shape?.pattern?.test('/poems/qasida-1')).toBe(true);
    expect(shape?.pattern?.test('/poems/randomness')).toBe(true);
  });

  it('handles a realistic mixed file list end to end', () => {
    const files = [
      'index.astro',
      'about.astro',
      'developers.astro',
      'login.astro',
      'account/index.astro',
      '404.astro',
      '500.astro',
      'collections/index.astro',
      'collections/[slug].astro',
      'meters/index.astro',
      'meters/[slug].astro',
      'poems/[slug].astro',
      'poems/random.ts',
      'poets/index.astro',
      'poets/[slug].astro',
      'rhymes/index.astro',
      'rhymes/[slug].astro',
      'themes/index.astro',
      'themes/[slug].astro',
      'llms.txt.ts',
      'robots.txt.ts',
      'sitemap-index.xml.ts',
      'sitemap/poets.xml.ts',
      'sitemap/root.xml.ts',
      'sitemap/poems/[page].xml.ts',
      '.well-known/security.txt.ts',
    ];
    const shapes = shapesFromPageFiles(files);
    expect(shapes).toHaveLength(17);
    expect(shapes.filter((s) => s.isDynamic)).toHaveLength(6);
    expect(shapes.map((s) => s.shape)).toEqual(
      expect.arrayContaining(['about', 'developers', 'login', 'account'])
    );
    expect(shapes.map((s) => s.shape)).toContain('/');
    expect(shapes.map((s) => s.shape)).toContain('404');
    expect(shapes.map((s) => s.shape)).toContain('poems/[slug]');
  });
});
