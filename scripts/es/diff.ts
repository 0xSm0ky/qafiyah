#!/usr/bin/env bun

import type { Snapshot } from './types';

const [leftPath, rightPath] = [process.argv[2], process.argv[3]];
if (!leftPath || !rightPath) {
  console.error('usage: bun scripts/es/diff.ts <baseline.json> <candidate.json>');
  process.exit(1);
}

const left = (await Bun.file(leftPath).json()) as Snapshot;
const right = (await Bun.file(rightPath).json()) as Snapshot;

const differences: string[] = [];

function compareJson(label: string, a: unknown, b: unknown): void {
  const before = JSON.stringify(a, null, 1);
  const after = JSON.stringify(b, null, 1);
  if (before === after) return;
  differences.push(`${label} differs`);
  const leftLines = before.split('\n');
  const rightLines = after.split('\n');
  const max = Math.max(leftLines.length, rightLines.length);
  let shown = 0;
  for (let i = 0; i < max && shown < 12; i++) {
    if (leftLines[i] !== rightLines[i]) {
      differences.push(
        `    - ${leftLines[i] ?? '(absent)'}`,
        `    + ${rightLines[i] ?? '(absent)'}`
      );
      shown++;
    }
  }
}

for (const leftAlias of left.aliases) {
  const rightAlias = right.aliases.find((entry) => entry.alias === leftAlias.alias);
  if (!rightAlias) {
    differences.push(`alias ${leftAlias.alias} missing from candidate`);
    continue;
  }

  compareJson(`${leftAlias.alias} settings`, leftAlias.settings, rightAlias.settings);
  compareJson(`${leftAlias.alias} mappings`, leftAlias.mappings, rightAlias.mappings);

  if (leftAlias.docCount !== rightAlias.docCount) {
    differences.push(
      `${leftAlias.alias} doc count: ${leftAlias.docCount} -> ${rightAlias.docCount}`
    );
  }

  const rightById = new Map(rightAlias.docs.map((doc) => [doc.id, doc.hash]));
  const missing: string[] = [];
  const changed: string[] = [];
  for (const doc of leftAlias.docs) {
    const candidate = rightById.get(doc.id);
    if (candidate === undefined) missing.push(doc.id);
    else if (candidate !== doc.hash) changed.push(doc.id);
    rightById.delete(doc.id);
  }
  const added = [...rightById.keys()];

  if (missing.length > 0) {
    differences.push(
      `${leftAlias.alias}: ${missing.length} docs missing, e.g. ${missing.slice(0, 5).join(', ')}`
    );
  }
  if (added.length > 0) {
    differences.push(
      `${leftAlias.alias}: ${added.length} docs added, e.g. ${added.slice(0, 5).join(', ')}`
    );
  }
  if (changed.length > 0) {
    differences.push(
      `${leftAlias.alias}: ${changed.length} docs changed, e.g. ${changed.slice(0, 10).join(', ')}`
    );
  }
}

if (differences.length > 0) {
  console.error('Snapshots differ:\n');
  for (const line of differences) console.error(`  ${line}`);
  console.error('');
  process.exit(1);
}

const total = left.aliases.reduce((sum, alias) => sum + alias.docCount, 0);
console.log(`Snapshots identical: ${left.aliases.length} aliases, ${total} documents.`);
