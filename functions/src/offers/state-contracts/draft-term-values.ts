/** Common draft input conversions; each contract keeps its own field rules and limits. */
export const record = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v)
    ? v as Record<string, unknown>
    : {};

export const text = (v: unknown, max = 5000) =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

export const money = (v: unknown) =>
  Number.isSafeInteger(v) && Number(v) >= 0 ? Number(v) : 0;

export const integer = (v: unknown) =>
  Number.isSafeInteger(v) ? Number(v) : 0;

export const bool = (v: unknown): boolean | null =>
  typeof v === 'boolean' ? v : null;

export const choice = <T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T
): T =>
  typeof v === 'string' && allowed.includes(v as T)
    ? v as T
    : fallback;

/** Decimal-valued percentages/rates retain the original finite-number behavior. */
export const finiteNumber = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0;
