#!/usr/bin/env bun

import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import { extractSpecifiers, lineAt } from '../lib/imports';
import { reportViolations } from '../lib/report';
import { ROOT } from '../lib/root';
import { walkFiles } from '../lib/walk';

const SCAN_ROOTS = ['apps', 'packages'];

type Violation = { file: string; line: number; spec: string };

const violations: Violation[] = [];

for (const scanRoot of SCAN_ROOTS) {
  const dir = join(ROOT, scanRoot);
  for (const file of walkFiles(dir)) {
    const content = readFileSync(file, 'utf8');
    for (const { spec, index } of extractSpecifiers(content)) {
      if (!spec.startsWith('../')) continue;
      violations.push({ file: relative(ROOT, file), line: lineAt(content, index), spec });
    }
  }
}

process.exit(
  reportViolations({
    title: 'Parent-relative imports detected:',
    lines: violations.map((v) => `${v.file}:${v.line}  "${v.spec}"`),
    rule: [
      'Rule: no "../" imports. Use sibling "./" imports or the "@/" alias in apps.',
      'For packages/*, flatten the directory so all imports stay sibling-only.',
    ],
    ok: 'No parent-relative imports.',
  })
);
