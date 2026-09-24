import { rhymeScore, sharedLiteralSuffixLength } from './qafiya';
import { THRESHOLDS } from './verdict';

import type { SoundClassTable } from './arabic-text';

const MIN_ANCHOR_AJUZ = 4;
const MIN_ANCHOR_SUFFIX = 2;

export function isAnchor(ajuz: readonly string[]): boolean {
  return ajuz.length >= MIN_ANCHOR_AJUZ && sharedLiteralSuffixLength(ajuz) >= MIN_ANCHOR_SUFFIX;
}

export function anchorRecall(
  anchors: readonly (readonly string[])[],
  table: SoundClassTable
): number {
  if (anchors.length === 0) return 1;
  const verified = anchors.filter((ajuz) => rhymeScore(ajuz, table) >= THRESHOLDS.minRhymeScore);
  return verified.length / anchors.length;
}

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function syntheticFalsePositiveRate(
  pool: readonly string[],
  ajuzCount: number,
  trials: number,
  table: SoundClassTable,
  seed: number
): number {
  if (pool.length === 0 || trials === 0) return 0;
  const random = createRandom(seed);
  let passes = 0;
  for (let trial = 0; trial < trials; trial += 1) {
    const sample: string[] = [];
    for (let index = 0; index < ajuzCount; index += 1) {
      sample.push(pool[Math.floor(random() * pool.length)] as string);
    }
    if (rhymeScore(sample, table) >= THRESHOLDS.minRhymeScore) passes += 1;
  }
  return passes / trials;
}
