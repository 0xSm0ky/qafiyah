import { describe, expect, it } from 'vitest';

import { deriveAdjacentPoems } from './adjacent-poems';

describe('deriveAdjacentPoems', () => {
  it('links both directions when the poem has neighbors on both sides', () => {
    const view = deriveAdjacentPoems({
      prev: { title: 'قصيدة سابقة', slug: 'UmlG' },
      next: { title: 'قصيدة تالية', slug: 'SOeo' },
    });
    expect(view.prevHref).toBe('/poems/UmlG');
    expect(view.nextHref).toBe('/poems/SOeo');
    expect(view.hidden).toBe(false);
  });

  it('leaves prevHref undefined on the first poem (no prev)', () => {
    const view = deriveAdjacentPoems({
      next: { title: 'قصيدة تالية', slug: 'SOeo' },
    });
    expect(view.prevHref).toBeUndefined();
    expect(view.nextHref).toBe('/poems/SOeo');
    expect(view.hidden).toBe(false);
  });

  it('leaves nextHref undefined on the last poem (no next)', () => {
    const view = deriveAdjacentPoems({
      prev: { title: 'قصيدة سابقة', slug: 'UmlG' },
    });
    expect(view.nextHref).toBeUndefined();
    expect(view.prevHref).toBe('/poems/UmlG');
    expect(view.hidden).toBe(false);
  });

  it('hides entirely when the poet has only one poem', () => {
    const view = deriveAdjacentPoems({});
    expect(view.prevHref).toBeUndefined();
    expect(view.nextHref).toBeUndefined();
    expect(view.hidden).toBe(true);
  });
});
