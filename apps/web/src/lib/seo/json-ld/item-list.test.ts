import { describe, expect, it } from 'vitest';

import { buildItemList } from './item-list';

describe('buildItemList', () => {
  it('derives numberOfItems from the input length', () => {
    expect(buildItemList(['a', 'b', 'c']).numberOfItems).toBe(3);
  });

  it('derives position from array index, starting at 1', () => {
    const list = buildItemList(['a', 'b']);
    expect(list.itemListElement.map((entry) => entry.position)).toEqual([1, 2]);
    expect(list.itemListElement.map((entry) => entry.item)).toEqual(['a', 'b']);
  });

  it('handles an empty list', () => {
    const list = buildItemList<string>([]);
    expect(list.numberOfItems).toBe(0);
    expect(list.itemListElement).toEqual([]);
  });

  it('omits name when not given, includes it when given', () => {
    expect(buildItemList(['a']).name).toBeUndefined();
    expect(buildItemList(['a'], { name: 'قائمة' }).name).toBe('قائمة');
  });
});
