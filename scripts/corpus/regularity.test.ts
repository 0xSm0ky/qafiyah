import { describe, expect, test } from 'bun:test';

import { coefficientOfVariation, madOutlierShare, median } from './regularity';

describe('median', () => {
  test('takes the middle of an odd-length list', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  test('averages the middle pair of an even-length list', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('coefficientOfVariation', () => {
  test('is near zero for a regular qasida', () => {
    expect(coefficientOfVariation([31, 30, 32, 29, 31, 30])).toBeCloseTo(0.0314, 4);
  });

  test('rises sharply when one hemistich is oversized', () => {
    expect(coefficientOfVariation([31, 30, 32, 58, 29])).toBeCloseTo(0.3068, 4);
  });

  test('returns zero for an empty list', () => {
    expect(coefficientOfVariation([])).toBe(0);
  });
});

describe('madOutlierShare', () => {
  test('flags nothing in a tight cluster', () => {
    expect(madOutlierShare([31, 30, 32, 29, 31, 30])).toBe(0);
  });

  test('flags the one hemistich beyond three scaled MAD', () => {
    expect(madOutlierShare([31, 30, 32, 58, 29])).toBe(0.2);
  });

  test('returns zero for an empty list', () => {
    expect(madOutlierShare([])).toBe(0);
  });
});
