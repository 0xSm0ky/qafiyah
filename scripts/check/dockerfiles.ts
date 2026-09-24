#!/usr/bin/env bun

import { basename } from 'node:path';

import { runExternalLinter } from '../lib/external-linter';
import { listTrackedFiles } from '../lib/tracked-files';

const isDockerfile = (path: string): boolean => {
  const name = basename(path);
  return name === 'Dockerfile' || name.startsWith('Dockerfile.') || name.endsWith('.Dockerfile');
};

const tracked = listTrackedFiles();
if (tracked.isErr()) {
  console.error(tracked.error);
  process.exit(1);
}

process.exit(
  runExternalLinter({
    tool: 'hadolint',
    args: [],
    files: tracked.value.filter(isDockerfile),
    installHint: 'brew install hadolint',
  })
);
