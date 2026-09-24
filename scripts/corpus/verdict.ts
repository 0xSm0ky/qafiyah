import type { StructureKind } from './hemistichs';

export const THRESHOLDS = {
  minRhymeScore: 0.9,
  maxCoefficientOfVariation: 0.2,
  minAjuzForScore: 5,
  minAjuzForSuffix: 2,
  minSharedSuffix: 2,
  minUsableHemistichs: 2,
} as const;

export const CALIBRATION_BOUNDS = {
  minAnchorRecall: 0.98,
  maxSyntheticFalsePositive: 0.01,
  syntheticAjuzCount: 5,
} as const;

const VERDICTS = ['verified', 'untestable', 'contradicted'] as const;
export type Verdict = (typeof VERDICTS)[number];

const VERDICT_REASONS = [
  'rhyme-verified',
  'suffix-verified',
  'rhyme-scattered',
  'length-irregular',
  'no-shared-suffix',
  'too-few-ajuz',
  'too-few-hemistichs',
  'irregular-structure',
] as const;
type VerdictReason = (typeof VERDICT_REASONS)[number];

export type PoemEvidence = {
  readonly structure: StructureKind;
  readonly ajuzCount: number;
  readonly rhymeScore: number;
  readonly sharedSuffixLength: number;
  readonly coefficientOfVariation: number;
  readonly usableHemistichs: number;
};

export type Assessment = {
  readonly verdict: Verdict;
  readonly reason: VerdictReason;
};

export function assess(evidence: PoemEvidence): Assessment {
  if (evidence.structure === 'irregular') {
    return { verdict: 'untestable', reason: 'irregular-structure' };
  }
  if (evidence.usableHemistichs < THRESHOLDS.minUsableHemistichs) {
    return { verdict: 'untestable', reason: 'too-few-hemistichs' };
  }

  const lengthsAreRegular = evidence.coefficientOfVariation <= THRESHOLDS.maxCoefficientOfVariation;

  if (evidence.ajuzCount >= THRESHOLDS.minAjuzForScore) {
    if (evidence.rhymeScore < THRESHOLDS.minRhymeScore) {
      return { verdict: 'contradicted', reason: 'rhyme-scattered' };
    }
    return lengthsAreRegular
      ? { verdict: 'verified', reason: 'rhyme-verified' }
      : { verdict: 'untestable', reason: 'length-irregular' };
  }

  if (evidence.ajuzCount >= THRESHOLDS.minAjuzForSuffix) {
    if (evidence.sharedSuffixLength < THRESHOLDS.minSharedSuffix) {
      return { verdict: 'untestable', reason: 'no-shared-suffix' };
    }
    return lengthsAreRegular
      ? { verdict: 'verified', reason: 'suffix-verified' }
      : { verdict: 'untestable', reason: 'length-irregular' };
  }

  return { verdict: 'untestable', reason: 'too-few-ajuz' };
}
