#!/usr/bin/env bun

import { createHash } from 'node:crypto';

import { Client, HttpConnection } from '@elastic/elasticsearch';

import type { AliasSnapshot, DocDigest, Snapshot } from './types';
import type { SortResults } from '@elastic/elasticsearch/lib/api/types';

type Identity = { readonly poemsAlias: string; readonly poetsAlias: string };

const schema = (await Bun.file('crates/elasticsearch/schema.json').json()) as {
  readonly identity: Identity;
};

const ALIASES = [schema.identity.poemsAlias, schema.identity.poetsAlias] as const;
const PAGE_SIZE = 1000;

const VOLATILE_SETTINGS = new Set(['uuid', 'creation_date', 'provided_name', 'version']);

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => canonical(entry));
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = canonical((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

function hashOf(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonical(value)))
    .digest('hex')
    .slice(0, 16);
}

function stripVolatile(settings: Record<string, unknown>): Record<string, unknown> {
  const index = (settings['index'] ?? {}) as Record<string, unknown>;
  const kept: Record<string, unknown> = {};
  for (const key of Object.keys(index).sort()) {
    if (!VOLATILE_SETTINGS.has(key)) kept[key] = index[key];
  }
  return kept;
}

async function snapshotAlias(es: Client, alias: string): Promise<AliasSnapshot> {
  const settingsResponse = await es.indices.getSettings({ index: alias });
  const mappingResponse = await es.indices.getMapping({ index: alias });
  const concrete = Object.keys(settingsResponse)[0] ?? alias;

  const docs: DocDigest[] = [];
  let searchAfter: SortResults | undefined;
  for (;;) {
    const page = await es.search<Record<string, unknown>>({
      index: alias,
      size: PAGE_SIZE,
      sort: [{ id: 'asc' }],
      ...(searchAfter ? { search_after: searchAfter } : {}),
      track_total_hits: true,
    });
    const hits = page.hits.hits;
    if (hits.length === 0) break;
    for (const hit of hits) docs.push({ id: String(hit._id), hash: hashOf(hit._source) });
    const last = hits.at(-1);
    if (!last?.sort) break;
    searchAfter = last.sort;
  }

  docs.sort((a, b) => Number(a.id) - Number(b.id));

  return {
    alias,
    settings: stripVolatile(settingsResponse[concrete]?.settings ?? {}),
    mappings: canonical(mappingResponse[concrete]?.mappings ?? {}),
    docCount: docs.length,
    docs,
  };
}

const esUrl = process.env['ELASTICSEARCH_URL'];
if (!esUrl) {
  console.error('ELASTICSEARCH_URL is required');
  process.exit(1);
}
const out = process.argv[2];
if (!out) {
  console.error('usage: bun scripts/es/snapshot.ts <out.json>');
  process.exit(1);
}

const es = new Client({
  node: new URL(esUrl).toString(),
  Connection: HttpConnection,
  requestTimeout: 10_000,
  maxRetries: 2,
});

const aliases: AliasSnapshot[] = [];
for (const alias of ALIASES) {
  const aliasSnapshot = await snapshotAlias(es, alias);
  aliases.push(aliasSnapshot);
  console.log(`  ${alias}: ${aliasSnapshot.docCount} docs`);
}

const snapshot: Snapshot = { takenAt: new Date().toISOString(), aliases };

await Bun.write(out, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`snapshot written to ${out}`);
