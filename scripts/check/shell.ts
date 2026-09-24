#!/usr/bin/env bun

import { extname } from 'node:path';

import { runExternalLinter } from '../lib/external-linter';
import { ROOT } from '../lib/root';
import { listTrackedFiles } from '../lib/tracked-files';

const SHELL_SHEBANG = /^#!\s*\/(?:usr\/)?bin\/(?:env\s+)?(?:ba|da)?sh\b/;

async function isShellScript(path: string): Promise<boolean> {
  if (path.endsWith('.sh')) return true;
  if (extname(path) !== '') return false;
  return SHELL_SHEBANG.test(await Bun.file(`${ROOT}/${path}`).slice(0, 64).text());
}

const tracked = listTrackedFiles();
if (tracked.isErr()) {
  console.error(tracked.error);
  process.exit(1);
}

const flags = await Promise.all(tracked.value.map((path) => isShellScript(path)));
process.exit(
  runExternalLinter({
    tool: 'shellcheck',
    args: ['--severity=warning'],
    files: tracked.value.filter((_, index) => flags[index] === true),
    installHint: 'brew install shellcheck, or apt-get install shellcheck',
  })
);
