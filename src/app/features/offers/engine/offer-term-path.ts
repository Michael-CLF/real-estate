/** Immutable nested updates; state updaters retain their own allowed paths and conversions. */
export function updatePath(source: unknown, [head, ...tail]: readonly string[], value: unknown): Record<string, unknown> {
  const record = source && typeof source === 'object' && !Array.isArray(source) ? source as Record<string, unknown> : {};
  if (!head) return record;
  return { ...record, [head]: tail.length ? updatePath(record[head], tail, value) : value };
}