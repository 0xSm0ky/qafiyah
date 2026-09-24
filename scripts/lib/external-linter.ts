import { ROOT } from './root';

type ExternalLinter = {
  readonly tool: string;
  readonly args: readonly string[];
  readonly files: readonly string[];
  readonly installHint: string;
};

export function runExternalLinter(linter: ExternalLinter): number {
  if (!Bun.which(linter.tool)) {
    console.error(`${linter.tool} is not installed (${linter.installHint})`);
    return 1;
  }
  if (linter.files.length === 0) {
    console.error(`${linter.tool}: no files to check`);
    return 1;
  }
  const result = Bun.spawnSync([linter.tool, ...linter.args, ...linter.files], {
    cwd: ROOT,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  if (result.exitCode === 0) {
    console.log(`${linter.tool} passed: ${linter.files.length} files.`);
  }
  return result.exitCode;
}
