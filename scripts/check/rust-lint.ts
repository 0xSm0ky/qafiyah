#!/usr/bin/env bun

import { ROOT } from '../lib/root';

const clippy = Bun.spawn(
  ['cargo', 'clippy', '--workspace', '--locked', '--all-targets', '--', '-D', 'warnings'],
  {
    cwd: ROOT,
    env: { ...process.env, CARGO_TERM_COLOR: 'never' },
    stdout: 'inherit',
    stderr: 'pipe',
  }
);

const decoder = new TextDecoder();
let stderr = '';
for await (const chunk of clippy.stderr) {
  process.stderr.write(chunk);
  stderr += decoder.decode(chunk, { stream: true });
}

const code = await clippy.exited;
if (code !== 0) process.exit(code);

const cargoWarnings = stderr.split('\n').filter((line) => line.startsWith('warning:'));
if (cargoWarnings.length > 0) {
  console.error(
    '\nClippy passed, but cargo itself warned (an unused Cargo.toml key, say), which -D warnings does not reach.'
  );
  process.exit(1);
}
