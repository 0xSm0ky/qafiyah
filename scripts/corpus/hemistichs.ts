import { lettersOnly } from './arabic-text';

const ROW_DELIMITER = '|';
const HEMISTICH_DELIMITER = '*';
const MIN_PROVENANCED_HEMISTICHS = 4;

const STRUCTURE_KINDS = ['starred', 'flat', 'mixed', 'irregular'] as const;
export type StructureKind = (typeof STRUCTURE_KINDS)[number];

const AJUZ_HYPOTHESIS_NAMES = [
  'starred',
  'mixed-starred',
  'flat-every',
  'flat-alternating',
] as const;
export type AjuzHypothesisName = (typeof AJUZ_HYPOTHESIS_NAMES)[number];

export type PoemRows = readonly (readonly string[])[];

export type AjuzHypothesis = {
  readonly name: AjuzHypothesisName;
  readonly ajuz: readonly string[];
};

export function parseRows(body: string): PoemRows {
  return body
    .split(ROW_DELIMITER)
    .map((row) =>
      row
        .split(HEMISTICH_DELIMITER)
        .map((hemistich) => hemistich.trim())
        .filter((hemistich) => lettersOnly(hemistich).length > 0)
    )
    .filter((row) => row.length > 0);
}

export function classifyStructure(rows: PoemRows): StructureKind {
  const widths = new Set(rows.map((row) => row.length));
  if ([...widths].some((width) => width > 2)) return 'irregular';
  if (widths.size > 1) return 'mixed';
  return widths.has(2) ? 'starred' : 'flat';
}

export function ajuzHypotheses(rows: PoemRows, kind: StructureKind): readonly AjuzHypothesis[] {
  switch (kind) {
    case 'irregular':
      return [];
    case 'starred':
      return [{ name: 'starred', ajuz: rows.map((row) => row[1] as string) }];
    case 'mixed': {
      const ajuz = rows.filter((row) => row.length === 2).map((row) => row[1] as string);
      return ajuz.length >= 2 ? [{ name: 'mixed-starred', ajuz }] : [];
    }
    case 'flat': {
      const lines = rows.map((row) => row[0] as string);
      const alternating = lines.filter((_, index) => index % 2 === 1);
      const hypotheses: AjuzHypothesis[] = [{ name: 'flat-every', ajuz: lines }];
      if (alternating.length >= 2) hypotheses.push({ name: 'flat-alternating', ajuz: alternating });
      return hypotheses;
    }
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function provenancedHemistichs(rows: PoemRows, kind: StructureKind): readonly string[] {
  if (kind === 'mixed') {
    const starred = rows.filter((row) => row.length === 2).flat();
    if (starred.length >= MIN_PROVENANCED_HEMISTICHS) return starred;
  }
  return rows.flat();
}
