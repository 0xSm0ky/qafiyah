import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ensureEnvFileFrom } from './env-file';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'env-file-test-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('ensureEnvFileFrom', () => {
  test('copies the source into the target when the target is missing', async () => {
    const source = join(dir, 'source.env');
    const target = join(dir, 'target.env');
    await Bun.write(source, 'DUMP_KEY__example=secret\n');

    const result = await ensureEnvFileFrom(target, source);

    expect(result).toBe('created');
    expect(await Bun.file(target).text()).toBe('DUMP_KEY__example=secret\n');
  });

  test('leaves an existing target untouched', async () => {
    const source = join(dir, 'source.env');
    const target = join(dir, 'target.env');
    await Bun.write(source, 'DUMP_KEY__example=secret\n');
    await Bun.write(target, 'DUMP_KEY__existing=keep-me\n');

    const result = await ensureEnvFileFrom(target, source);

    expect(result).toBe('skipped');
    expect(await Bun.file(target).text()).toBe('DUMP_KEY__existing=keep-me\n');
  });

  test('skips when the source does not exist', async () => {
    const source = join(dir, 'missing.env');
    const target = join(dir, 'target.env');

    const result = await ensureEnvFileFrom(target, source);

    expect(result).toBe('skipped');
    expect(await Bun.file(target).exists()).toBe(false);
  });
});
