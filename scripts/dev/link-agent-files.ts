#!/usr/bin/env bun

import { lstatSync, readlinkSync, symlinkSync, unlinkSync } from 'node:fs';
import { dirname, relative } from 'node:path';

import { ROOT } from '../lib/root';
import { walkFiles } from '../lib/walk';

const SOURCE = 'AGENTS.md';
const LINKS = ['CLAUDE.md', 'GEMINI.md'] as const;

function ensureLink(dir: string, name: string): void {
  const linkPath = `${dir}/${name}`;
  const label = relative(ROOT, linkPath);
  let existing: ReturnType<typeof lstatSync> | undefined;
  try {
    existing = lstatSync(linkPath);
  } catch {
    existing = undefined;
  }

  if (existing) {
    if (!existing.isSymbolicLink()) {
      console.log(`  skip  ${label} (exists, not a symlink)`);
      return;
    }
    if (readlinkSync(linkPath) === SOURCE) {
      console.log(`  ok    ${label}`);
      return;
    }
    unlinkSync(linkPath);
  }

  try {
    symlinkSync(SOURCE, linkPath, 'file');
    console.log(`  link  ${label} -> ${SOURCE}`);
  } catch (e) {
    console.log(`  warn  ${label}: ${e instanceof Error ? e.message : String(e)}`);
    console.log('        On Windows, creating symlinks needs Developer Mode or an admin shell.');
  }
}

for (const agentsFile of walkFiles(ROOT, { exts: [SOURCE] })) {
  const dir = dirname(agentsFile);
  for (const name of LINKS) ensureLink(dir, name);
}
