/** Elapsed hours, independent of contract deadline time zones and local calendar-day rules. */
export function offerExpirationAfterHours(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}
