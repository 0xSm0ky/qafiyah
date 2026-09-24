import { describe, expect, test } from 'bun:test';

import { ajuzHypotheses, classifyStructure, parseRows, provenancedHemistichs } from './hemistichs';

const STARRED = 'قفا نبك*بسقط اللوى|أمن أم أوفى*دمنة لم تكلم';
const FLAT = 'وحرة ذات حر مستور|إلا عن الأعين والأيور|نشلت منها عضد البعير|مثل الرشاء من قرار البير';
const MIXED = 'قفا نبك*بسقط اللوى|سطر بلا نجمة|أمن أم أوفى*دمنة لم تكلم';
const IRREGULAR = 'جزء*جزء*جزء|سطر آخر';

describe('parseRows', () => {
  test('splits rows on the pipe and hemistichs on the star', () => {
    expect(parseRows(STARRED)).toEqual([
      ['قفا نبك', 'بسقط اللوى'],
      ['أمن أم أوفى', 'دمنة لم تكلم'],
    ]);
  });

  test('drops hemistichs that hold no Arabic letters', () => {
    expect(parseRows('قفا نبك*   |123')).toEqual([['قفا نبك']]);
  });
});

describe('classifyStructure', () => {
  test('calls every-row-one-star starred', () => {
    expect(classifyStructure(parseRows(STARRED))).toBe('starred');
  });

  test('calls every-row-no-star flat', () => {
    expect(classifyStructure(parseRows(FLAT))).toBe('flat');
  });

  test('calls a poem with both kinds of row mixed', () => {
    expect(classifyStructure(parseRows(MIXED))).toBe('mixed');
  });

  test('calls a row with two stars irregular', () => {
    expect(classifyStructure(parseRows(IRREGULAR))).toBe('irregular');
  });
});

describe('ajuzHypotheses', () => {
  test('takes the text after the star for a starred poem', () => {
    const rows = parseRows(STARRED);
    expect(ajuzHypotheses(rows, 'starred')).toEqual([
      { name: 'starred', ajuz: ['بسقط اللوى', 'دمنة لم تكلم'] },
    ]);
  });

  test('offers both readings for a flat poem', () => {
    const rows = parseRows(FLAT);
    const names = ajuzHypotheses(rows, 'flat').map((h) => h.name);
    expect(names).toEqual(['flat-every', 'flat-alternating']);
  });

  test('uses only starred rows for a mixed poem, so indices never drift', () => {
    const rows = parseRows(MIXED);
    expect(ajuzHypotheses(rows, 'mixed')).toEqual([
      { name: 'mixed-starred', ajuz: ['بسقط اللوى', 'دمنة لم تكلم'] },
    ]);
  });

  test('offers nothing for an irregular poem', () => {
    expect(ajuzHypotheses(parseRows(IRREGULAR), 'irregular')).toEqual([]);
  });

  test('offers nothing for a mixed poem with fewer than two starred rows', () => {
    const rows = parseRows('قفا نبك*بسقط اللوى|سطر بلا نجمة');
    expect(ajuzHypotheses(rows, 'mixed')).toEqual([]);
  });
});

describe('provenancedHemistichs', () => {
  test('returns every hemistich for a starred poem', () => {
    expect(provenancedHemistichs(parseRows(STARRED), 'starred')).toHaveLength(4);
  });

  test('uses only known-provenance hemistichs for a mixed poem', () => {
    const rows = parseRows(MIXED);
    expect(provenancedHemistichs(rows, 'mixed')).toEqual([
      'قفا نبك',
      'بسقط اللوى',
      'أمن أم أوفى',
      'دمنة لم تكلم',
    ]);
  });

  test('falls back to all rows when a mixed poem has too few starred hemistichs', () => {
    const rows = parseRows('قفا نبك*بسقط اللوى|سطر بلا نجمة|سطر ثالث');
    expect(provenancedHemistichs(rows, 'mixed')).toEqual([
      'قفا نبك',
      'بسقط اللوى',
      'سطر بلا نجمة',
      'سطر ثالث',
    ]);
  });
});
