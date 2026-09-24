import { lettersOnly, normalizeLetter, type SoundClassTable } from './arabic-text';

const WASL_VOWELS: ReadonlySet<string> = new Set(['ي', 'ا', 'ى', 'و', 'ه', 'ة']);
const WAW_AL_JAMAAH = 'وا';

export function rawiCandidates(ajuz: string, table: SoundClassTable): ReadonlySet<string> {
  const word = lettersOnly(ajuz);
  const candidates = new Set<string>();
  const last = word.at(-1);
  if (last === undefined) return candidates;

  candidates.add(normalizeLetter(last, table));

  if (word.length >= 3 && word.endsWith(WAW_AL_JAMAAH)) {
    candidates.add(normalizeLetter(word.at(-3) as string, table));
  }

  if (word.length >= 2 && WASL_VOWELS.has(last)) {
    candidates.add(normalizeLetter(word.at(-2) as string, table));
  }

  return candidates;
}

export function rhymeScore(ajuz: readonly string[], table: SoundClassTable): number {
  const sets = ajuz
    .map((line) => rawiCandidates(line, table))
    .filter((candidates) => candidates.size > 0);
  if (sets.length === 0) return 0;

  const tally = new Map<string, number>();
  for (const set of sets) {
    for (const candidate of set) tally.set(candidate, (tally.get(candidate) ?? 0) + 1);
  }

  return Math.max(...tally.values()) / sets.length;
}

export function sharedLiteralSuffixLength(ajuz: readonly string[]): number {
  const words = ajuz.map((line) => lettersOnly(line)).filter((word) => word.length > 0);
  if (words.length === 0) return 0;

  const shortest = Math.min(...words.map((word) => word.length));
  const first = words[0] as string;
  let shared = 0;
  while (
    shared < shortest &&
    words.every((word) => word.at(-1 - shared) === first.at(-1 - shared))
  ) {
    shared += 1;
  }
  return shared;
}

export function dominantRawi(ajuz: readonly string[], table: SoundClassTable): string | null {
  const sets = ajuz
    .map((line) => rawiCandidates(line, table))
    .filter((candidates) => candidates.size > 0);
  if (sets.length === 0) return null;

  const tally = new Map<string, number>();
  for (const set of sets) {
    for (const candidate of set) tally.set(candidate, (tally.get(candidate) ?? 0) + 1);
  }

  let best: string | null = null;
  let bestCount = 0;
  for (const [letter, count] of tally) {
    if (count > bestCount) {
      bestCount = count;
      best = letter;
    }
  }
  return best;
}
