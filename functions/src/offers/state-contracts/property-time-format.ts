/** The time zone is supplied by the state; timestamp formatting is shared. */
export function formatTimestamp(date: Date | undefined, timeZone: string): string {
  return date ? new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(date) : '';
}
