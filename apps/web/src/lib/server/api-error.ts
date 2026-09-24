const NOT_FOUND_STATUSES: ReadonlySet<number> = new Set([400, 404]);

export function isNotFoundStatus(status: number | null): boolean {
  return status !== null && NOT_FOUND_STATUSES.has(status);
}
