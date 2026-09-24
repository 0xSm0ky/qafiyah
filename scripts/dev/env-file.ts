export async function ensureEnvFileFrom(
  targetPath: string,
  sourcePath: string
): Promise<'created' | 'skipped'> {
  if (await Bun.file(targetPath).exists()) return 'skipped';
  if (!(await Bun.file(sourcePath).exists())) return 'skipped';
  await Bun.write(targetPath, Bun.file(sourcePath));
  return 'created';
}
