const importRe =
  /(?:^|[\s;])(?:import|export)(?:\s+[^'"`;]*?\s+from\s*)?\s*['"`]([^'"`]+)['"`]|require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;

export type ImportRef = { readonly spec: string; readonly index: number };

export function* extractSpecifiers(content: string): Generator<ImportRef> {
  for (const match of content.matchAll(importRe)) {
    const spec = match[1] ?? match[2];
    if (!spec) continue;
    yield { spec, index: match.index ?? 0 };
  }
}

export const lineAt = (content: string, index: number): number =>
  content.slice(0, index).split('\n').length;
