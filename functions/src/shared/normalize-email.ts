/**
 * Converts an email address into the normalized format used throughout
 * NavStreet authentication.
 */
export function normalizeEmail(
  value: unknown,
): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .toLowerCase();
}