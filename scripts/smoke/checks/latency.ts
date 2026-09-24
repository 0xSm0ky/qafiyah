import { err, ok, type Result } from 'neverthrow';

export const LATENCY_DISABLED = (process.env['SMOKE_LATENCY'] ?? '') === 'off';

export function latencyCheck(elapsedMs: number, budgetMs: number): Result<void, string> {
  if (LATENCY_DISABLED) return ok(undefined);
  return elapsedMs <= budgetMs ? ok(undefined) : err(`took ${elapsedMs}ms, budget ${budgetMs}ms`);
}
