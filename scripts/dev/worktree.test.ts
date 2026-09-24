import { describe, expect, test } from 'bun:test';

import { computeOffset, slugify } from './worktree';

describe('slugify', () => {
  test('lowercases and hyphenates non-alphanumeric runs', () => {
    expect(slugify('Feature_X!!')).toBe('feature-x');
  });

  test('trims leading and trailing hyphens', () => {
    expect(slugify('--feature--')).toBe('feature');
  });
});

describe('computeOffset', () => {
  test('is deterministic for the same slug', () => {
    expect(computeOffset('feature-x')).toBe(computeOffset('feature-x'));
  });

  test('is always a multiple of 10 between 10 and 490', () => {
    for (const slug of ['a', 'feature-x', 'bugfix-123', 'very-long-worktree-name']) {
      const offset = computeOffset(slug);
      expect(offset).toBeGreaterThanOrEqual(10);
      expect(offset).toBeLessThanOrEqual(490);
      expect(offset % 10).toBe(0);
    }
  });

  test('never returns 0, since 0 is reserved for "no isolation"', () => {
    for (const slug of ['a', 'b', 'c', 'feature-x', 'main', '']) {
      expect(computeOffset(slug)).not.toBe(0);
    }
  });
});
