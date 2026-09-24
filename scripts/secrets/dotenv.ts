export type DotenvEntry = { readonly key: string; readonly value: string; readonly line: number };

export type ParsedDotenv = {
  readonly entries: readonly DotenvEntry[];
  readonly malformedLines: readonly number[];
};

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function parseDotenv(text: string): ParsedDotenv {
  const entries: DotenvEntry[] = [];
  const malformedLines: number[] = [];
  text.split('\n').forEach((raw, index) => {
    const line = index + 1;
    const trimmed = raw.trim();
    if (trimmed === '' || trimmed.startsWith('#')) return;
    const separator = raw.indexOf('=');
    const key = separator > 0 ? raw.slice(0, separator) : '';
    if (!KEY_PATTERN.test(key)) {
      malformedLines.push(line);
      return;
    }
    entries.push({ key, value: raw.slice(separator + 1), line });
  });
  return { entries, malformedLines };
}
