import { describe, expect, test } from 'bun:test';

import { assess, type PoemEvidence } from './verdict';

const evidence = (overrides: Partial<PoemEvidence> = {}): PoemEvidence => ({
  structure: 'starred',
  ajuzCount: 12,
  rhymeScore: 1,
  sharedSuffixLength: 3,
  coefficientOfVariation: 0.08,
  usableHemistichs: 24,
  ...overrides,
});

describe('assess', () => {
  test('verifies a long, regular, single-rhymed poem', () => {
    expect(assess(evidence())).toEqual({ verdict: 'verified', reason: 'rhyme-verified' });
  });

  test('contradicts a long poem whose rhyme is scattered', () => {
    expect(assess(evidence({ rhymeScore: 0.4 }))).toEqual({
      verdict: 'contradicted',
      reason: 'rhyme-scattered',
    });
  });

  test('never contradicts a short poem, even with a scattered rhyme', () => {
    const result = assess(evidence({ ajuzCount: 3, rhymeScore: 0.34, sharedSuffixLength: 0 }));
    expect(result).toEqual({ verdict: 'untestable', reason: 'no-shared-suffix' });
  });

  test('verifies a short poem on a shared literal suffix', () => {
    expect(assess(evidence({ ajuzCount: 3, rhymeScore: 0.34, sharedSuffixLength: 2 }))).toEqual({
      verdict: 'verified',
      reason: 'suffix-verified',
    });
  });

  test('holds back a rhymed poem whose lengths are irregular', () => {
    expect(assess(evidence({ coefficientOfVariation: 0.45 }))).toEqual({
      verdict: 'untestable',
      reason: 'length-irregular',
    });
  });

  test('cannot test an irregular structure', () => {
    expect(assess(evidence({ structure: 'irregular' }))).toEqual({
      verdict: 'untestable',
      reason: 'irregular-structure',
    });
  });

  test('cannot test a poem with fewer than two usable hemistichs', () => {
    expect(assess(evidence({ usableHemistichs: 1 }))).toEqual({
      verdict: 'untestable',
      reason: 'too-few-hemistichs',
    });
  });

  test('cannot test a poem with a single ajuz', () => {
    expect(assess(evidence({ ajuzCount: 1 }))).toEqual({
      verdict: 'untestable',
      reason: 'too-few-ajuz',
    });
  });

  test('uses the score test from five ajuz upward', () => {
    expect(assess(evidence({ ajuzCount: 5, rhymeScore: 0.4, sharedSuffixLength: 3 })).verdict).toBe(
      'contradicted'
    );
    expect(assess(evidence({ ajuzCount: 4, rhymeScore: 0.4, sharedSuffixLength: 3 })).verdict).toBe(
      'verified'
    );
  });
});
