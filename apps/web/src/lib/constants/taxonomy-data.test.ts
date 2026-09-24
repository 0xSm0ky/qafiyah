import { describe, expect, it } from 'vitest';

import { erasOptions } from '@/lib/generated/taxonomy/taxonomy-options.gen';

import { DEFAULT_ERA_SLUGS, sortMeterOptions } from './taxonomy-data';

describe('DEFAULT_ERA_SLUGS', () => {
  it('only names eras the generated taxonomy still exposes', () => {
    const known = new Set(erasOptions.map((option) => option.value));
    const missing = DEFAULT_ERA_SLUGS.filter((slug) => !known.has(slug));
    expect(missing).toEqual([]);
  });

  it('narrows the era list rather than covering all of it', () => {
    expect(DEFAULT_ERA_SLUGS.length).toBeGreaterThan(0);
    expect(DEFAULT_ERA_SLUGS.length).toBeLessThan(erasOptions.length);
  });

  it('lists each era once', () => {
    expect(new Set(DEFAULT_ERA_SLUGS).size).toBe(DEFAULT_ERA_SLUGS.length);
  });
});

describe('sortMeterOptions', () => {
  it('orders the standard meters by their classical order first', () => {
    const options = [
      { value: 'alrajz', label: 'الرجز', poemsCount: 10 },
      { value: 'altawil', label: 'الطويل', poemsCount: 5 },
      { value: 'custom', label: 'مخصص', poemsCount: 7 },
    ];
    expect(sortMeterOptions(options).map((o) => o.value)).toEqual(['altawil', 'alrajz', 'custom']);
  });

  it('sorts unknown meters after the standard ones by poem count descending', () => {
    const options = [
      { value: 'a', label: 'أ', poemsCount: 2 },
      { value: 'b', label: 'ب', poemsCount: 9 },
    ];
    expect(sortMeterOptions(options).map((o) => o.value)).toEqual(['b', 'a']);
  });
});
