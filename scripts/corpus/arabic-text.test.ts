import { describe, expect, test } from 'bun:test';

import {
  DEFAULT_SOUND_CLASSES,
  lettersOnly,
  normalizeLetter,
  OPTIONAL_SOUND_CLASSES,
  stripDiacritics,
} from './arabic-text';

describe('stripDiacritics', () => {
  test('removes harakat and keeps spacing', () => {
    expect(stripDiacritics('قِفا نَبكِ مِن ذِكرى حَبيبٍ وَمَنزِلِ')).toBe('قفا نبك من ذكرى حبيب ومنزل');
  });

  test('leaves an unvocalized line untouched', () => {
    expect(stripDiacritics('ونسج الثلج على الطيور')).toBe('ونسج الثلج على الطيور');
  });
});

describe('lettersOnly', () => {
  test('drops diacritics, spaces, and punctuation', () => {
    expect(lettersOnly('قِفا نَبكِ مِن ذِكرى حَبيبٍ وَمَنزِلِ')).toBe('قفانبكمنذكرىحبيبومنزل');
  });

  test('gives vocalized and unvocalized copies the same length', () => {
    expect(lettersOnly('أَلا فَاعْجِلْ')).toBe(lettersOnly('ألا فاعجل'));
  });

  test('returns empty for a line with no Arabic letters', () => {
    expect(lettersOnly('12 -- ...')).toBe('');
  });
});

describe('normalizeLetter', () => {
  test('merges hamza seats', () => {
    expect(normalizeLetter('ئ', DEFAULT_SOUND_CLASSES)).toBe(
      normalizeLetter('ء', DEFAULT_SOUND_CLASSES)
    );
  });

  test('merges the alef family', () => {
    expect(normalizeLetter('ى', DEFAULT_SOUND_CLASSES)).toBe(
      normalizeLetter('ا', DEFAULT_SOUND_CLASSES)
    );
  });

  test('merges taa marbuta with haa and taa', () => {
    expect(normalizeLetter('ة', DEFAULT_SOUND_CLASSES)).toBe(
      normalizeLetter('ت', DEFAULT_SOUND_CLASSES)
    );
    expect(normalizeLetter('ه', DEFAULT_SOUND_CLASSES)).toBe(
      normalizeLetter('ت', DEFAULT_SOUND_CLASSES)
    );
  });

  test('leaves dad and dha distinct by default', () => {
    expect(normalizeLetter('ض', DEFAULT_SOUND_CLASSES)).not.toBe(
      normalizeLetter('ظ', DEFAULT_SOUND_CLASSES)
    );
  });

  test('merges dad and dha only when the optional table is used', () => {
    const table = { ...DEFAULT_SOUND_CLASSES, ...OPTIONAL_SOUND_CLASSES };
    expect(normalizeLetter('ض', table)).toBe(normalizeLetter('ظ', table));
  });

  test('passes an unmapped letter through unchanged', () => {
    expect(normalizeLetter('ل', DEFAULT_SOUND_CLASSES)).toBe('ل');
  });
});
