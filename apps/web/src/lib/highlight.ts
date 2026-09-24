export const MAX_HIGHLIGHT_TERMS = 32;
export const MAX_HIGHLIGHT_TERM_LENGTH = 64;

export function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildHighlightRegex(terms: readonly string[]): RegExp | null {
  if (terms.length === 0) return null;
  const ordered = [...terms].sort((a, b) => b.length - a.length);
  const alternation = ordered.map((term) => escapeRegExp(term)).join('|');
  try {
    return new RegExp(`(?<![\\p{L}\\p{M}])(?:${alternation})(?![\\p{L}\\p{M}])`, 'gu');
  } catch {
    return null;
  }
}

export function parseHighlightTerms(hash: string): readonly string[] {
  if (!hash.startsWith('#h=')) return [];
  return hash
    .slice('#h='.length)
    .split(',')
    .slice(0, MAX_HIGHLIGHT_TERMS)
    .map((part) => safeDecode(part).trim())
    .filter((term) => term.length > 0 && term.length <= MAX_HIGHLIGHT_TERM_LENGTH);
}

export type HighlightSegment = { readonly text: string; readonly highlighted: boolean };

export function highlightSegments(text: string, regex: RegExp): readonly HighlightSegment[] {
  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) return [{ text, highlighted: false }];
  const parts: HighlightSegment[] = [];
  let start = 0;
  for (const match of matches) {
    const at = match.index;
    if (at > start) parts.push({ text: text.slice(start, at), highlighted: false });
    parts.push({ text: match[0], highlighted: true });
    start = at + match[0].length;
  }
  if (start < text.length) parts.push({ text: text.slice(start), highlighted: false });
  return parts;
}
