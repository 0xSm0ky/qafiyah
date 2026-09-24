import { describe, expect, test } from 'bun:test';

import { DEFAULT_SOUND_CLASSES } from './arabic-text';
import { anchorRecall, isAnchor, syntheticFalsePositiveRate } from './calibration';

describe('isAnchor', () => {
  test('accepts four ajuz sharing a two-letter ending', () => {
    expect(isAnchor(['المعاني', 'الأماني', 'التهاني', 'الغواني'])).toBe(true);
  });

  test('rejects a poem with too few ajuz', () => {
    expect(isAnchor(['المعاني', 'الأماني', 'التهاني'])).toBe(false);
  });

  test('rejects a poem sharing only one letter', () => {
    expect(isAnchor(['الوجد', 'الوعد', 'الغمد', 'الصمد'])).toBe(false);
  });
});

describe('anchorRecall', () => {
  test('is one when the scorer verifies every anchor', () => {
    const anchors = [
      ['المعاني', 'الأماني', 'التهاني', 'الغواني'],
      ['الواهي', 'الساهي', 'الناهي', 'اللاهي'],
    ];
    expect(anchorRecall(anchors, DEFAULT_SOUND_CLASSES)).toBe(1);
  });
});

describe('syntheticFalsePositiveRate', () => {
  test('is low for five ajuz drawn from unrelated poems', () => {
    const pool = ['الوجد', 'يصبح', 'يطنب', 'ينفطر', 'المعاني', 'الصبوح', 'مضجعا', 'الطيور'];
    expect(syntheticFalsePositiveRate(pool, 5, 2000, DEFAULT_SOUND_CLASSES, 1)).toBeLessThan(0.2);
  });

  test('is reproducible for a given seed', () => {
    const pool = ['الوجد', 'يصبح', 'يطنب', 'ينفطر', 'المعاني', 'الصبوح'];
    const first = syntheticFalsePositiveRate(pool, 5, 500, DEFAULT_SOUND_CLASSES, 7);
    const second = syntheticFalsePositiveRate(pool, 5, 500, DEFAULT_SOUND_CLASSES, 7);
    expect(first).toBe(second);
  });
});
