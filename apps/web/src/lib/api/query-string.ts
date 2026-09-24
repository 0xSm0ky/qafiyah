function toParam(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

export function serializeQuery(query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const param = toParam(item);
        if (param !== null) params.append(key, param);
      }
      continue;
    }
    const param = toParam(value);
    if (param !== null) params.append(key, param);
  }
  return params.toString();
}
