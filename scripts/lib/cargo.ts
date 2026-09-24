import { err, ok, type Result } from 'neverthrow';

export function cargoDump(bin: string): Result<string, string> {
  const dump = Bun.spawnSync(['cargo', 'run', '--quiet', '-p', 'qafiyah-api', '--bin', bin]);
  const decoder = new TextDecoder();
  if (dump.exitCode !== 0) return err(decoder.decode(dump.stderr));
  return ok(`${decoder.decode(dump.stdout).trim()}\n`);
}
