import {
  HttpsError,
} from 'firebase-functions/v2/https';


export function hasText(
  value: string | undefined
): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  );
}


export function requireText(
  value: string | undefined,
  message: string
): asserts value is string {
  requireCondition(hasText(value), message);
}


export function requireCondition(
  condition: boolean,
  message: string
): asserts condition {
  if (!condition) {
    throw new HttpsError(
      'failed-precondition',
      message
    );
  }
}


export function requireNonNegativeMoney(
  value: number,
  message: string
): void {
  requireCondition(
    Number.isInteger(value) && value >= 0,
    message
  );
}


export function requirePositiveDays(
  value: number | undefined,
  message: string
): void {
  requireCondition(
    Number.isInteger(value) && (value ?? 0) > 0,
    message
  );
}


export function isPositiveMoney(
  value: number
): boolean {
  return Number.isInteger(value) && value > 0;
}


export function isValidEmail(
  value: string | undefined
): boolean {
  return (
    typeof value === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value.trim()
    )
  );
}


export function isValidDate(
  value: string
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(value + 'T12:00:00Z');

  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}


export function isValidDateTime(
  value: string
): boolean {
  return (
    /(Z|[+-]\d{2}:\d{2})$/.test(value) &&
    parseDate(value) !== null
  );
}


export function parseDate(
  value: string | undefined
): Date | null {
  if (!value) {
    return null;
  }

  const normalized =
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? value + 'T12:00:00Z'
      : value;

  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}


export function startOfUtcDay(
  value: Date
): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate()
    )
  );
}
