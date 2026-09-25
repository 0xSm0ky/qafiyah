import { describe, expect, test } from 'bun:test';

import { POEMS_PER_PAGE } from '@qafiyah/config';

import { ROOT } from '../lib/root';

import { SAMPLE_FIXTURE_POETS } from './fixtures';

type SamplePoet = { readonly slug: string; readonly poems: readonly string[] };
type SampleManifest = {
  readonly source: string;
  readonly eras: readonly string[];
  readonly poets: readonly SamplePoet[];
};

const manifest = (await Bun.file(
  `${ROOT}/data/db/0000_default/manifest.json`
).json()) as SampleManifest;

const REAL_SLUG_LITERALS = [
  /POEM_DETAIL\(\s*['"`]([A-Za-z]{4})['"`]\s*\)/g,
  /\/(?:poems|poets)\/([A-Za-z]{4})(?![A-Za-z0-9])/g,
  /poetSlugs:\s*\[\s*['"`]([A-Za-z]{4})['"`]/g,
];

async function probeSources(): Promise<ReadonlyMap<string, string>> {
  const sources = new Map<string, string>();
  for await (const path of new Bun.Glob('scripts/smoke/**/*.ts').scan(ROOT)) {
    if (path.endsWith('.test.ts') || path.endsWith('/fixtures.ts')) continue;
    sources.set(path, await Bun.file(`${ROOT}/${path}`).text());
  }
  return sources;
}

describe('the committed sample dump', () => {
  test('holds every fixture poet with exactly the fixture poems, in id order', () => {
    for (const fixture of SAMPLE_FIXTURE_POETS) {
      const poet = manifest.poets.find((candidate) => candidate.slug === fixture.slug);
      expect(poet?.poems).toEqual([...fixture.poems]);
    }
  });

  test('stays pre-Islamic only, so it is safe to ship in plaintext', () => {
    expect(manifest.eras).toEqual(['jahili']);
  });

  test('has enough poets for the third page of the poets list', () => {
    expect(manifest.poets.length).toBeGreaterThan(2 * POEMS_PER_PAGE);
  });
});

describe('smoke probes', () => {
  test('name real poems and poets only through the fixtures the sample is built from', async () => {
    const offenders: string[] = [];
    for (const [path, source] of await probeSources()) {
      for (const pattern of REAL_SLUG_LITERALS) {
        for (const match of source.matchAll(pattern)) offenders.push(`${path}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
