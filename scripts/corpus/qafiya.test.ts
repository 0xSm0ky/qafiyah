import { describe, expect, test } from 'bun:test';

import { DEFAULT_SOUND_CLASSES } from './arabic-text';
import { dominantRawi, rawiCandidates, rhymeScore, sharedLiteralSuffixLength } from './qafiya';

const candidates = (word: string): readonly string[] =>
  [...rawiCandidates(word, DEFAULT_SOUND_CLASSES)].sort();
const score = (ajuz: readonly string[]): number => rhymeScore(ajuz, DEFAULT_SOUND_CLASSES);

describe('rawiCandidates', () => {
  test('offers the letter under a trailing wasl yaa', () => {
    expect(candidates('الواهي')).toContain('ة');
  });

  test('reaches the rawi under a trailing waw al-jamaah', () => {
    expect(candidates('زاروا')).toContain('ر');
  });

  test('normalizes a hamza seat', () => {
    expect(candidates('جائي')).toContain('ء');
  });

  test('reaches the rawi under a trailing taa marbuta', () => {
    expect(candidates('المظلمة')).toContain('م');
  });

  test('offers only the final letter when nothing is strippable', () => {
    expect(candidates('الوجد')).toEqual(['د']);
  });
});

describe('rhymeScore', () => {
  test('scores a wasl-variant rhyme as fully consistent', () => {
    expect(score(['الواهي', 'الساهي', 'الناهي', 'جاه'])).toBe(1);
  });

  test('treats alef and alef maqsura as one rhyme', () => {
    expect(score(['البكا', 'الهوى', 'سلا'])).toBe(1);
  });

  test('reports the majority share when one ending stands outside the class', () => {
    expect(score(['البكا', 'الهوى', 'سلا', 'الصبي'])).toBe(0.75);
  });

  test('scores scattered endings low', () => {
    expect(score(['الرفض', 'يصبح', 'يطنب', 'ينفطر'])).toBeLessThan(0.5);
  });

  test('returns zero for no usable ajuz', () => {
    expect(score([])).toBe(0);
  });
});

describe('sharedLiteralSuffixLength', () => {
  test('finds the shared rhyme letter', () => {
    expect(sharedLiteralSuffixLength(['الوجد', 'الوعد', 'الغمد'])).toBe(1);
  });

  test('finds a longer shared ending', () => {
    expect(sharedLiteralSuffixLength(['المعاني', 'الأماني'])).toBe(3);
  });

  test('returns zero when nothing is shared', () => {
    expect(sharedLiteralSuffixLength(['الوجد', 'يصبح'])).toBe(0);
  });
});

describe('dominantRawi', () => {
  test('names the rawi shared under a wasl vowel', () => {
    expect(dominantRawi(['الواهي', 'الساهي', 'جاه'], DEFAULT_SOUND_CLASSES)).toBe('ة');
  });

  test('names the rawi of a plain ending', () => {
    expect(dominantRawi(['الوجد', 'الوعد', 'الغمد'], DEFAULT_SOUND_CLASSES)).toBe('د');
  });

  test('returns null when there are no usable ajuz', () => {
    expect(dominantRawi([], DEFAULT_SOUND_CLASSES)).toBeNull();
  });
});
