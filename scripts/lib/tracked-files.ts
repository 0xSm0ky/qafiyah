import { existsSync } from 'node:fs';

import { err, ok, type Result } from 'neverthrow';

import { ROOT } from './root';

export function listTrackedFiles(): Result<readonly string[], string> {
  const listed = Bun.spawnSync(['git', 'ls-files', '-z'], { cwd: ROOT });
  if (listed.exitCode !== 0) {
    return err(`git ls-files failed: ${listed.stderr.toString().trim()}`);
  }
  return ok(
    listed.stdout
      .toString()
      .split('\0')
      .filter((path) => path !== '' && existsSync(`${ROOT}/${path}`))
  );
}
