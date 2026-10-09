/** Calendar arithmetic only; each state supplies its time zone and contractual starting offset. */
export function localCalendarDeadline(
  effectiveAt: Date,
  timeZone: string,
  periodDays: number,
  startOffset = 0,
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(effectiveAt);
  const part = (type: string) => Number(parts.find(item => item.type === type)?.value ?? 0);
  return new Date(Date.UTC(
    part('year'), part('month') - 1, part('day') + startOffset + periodDays,
  )).toISOString().slice(0, 10);
}
