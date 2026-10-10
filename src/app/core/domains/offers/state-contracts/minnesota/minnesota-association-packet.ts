/** Pure calendar validation; backend signing rechecks the certificate at acceptance time. */
export function minnesotaAssociationPacketProblem(issue: string, receipt: string, now = new Date()): string | undefined {
  const parse = (value: string): number => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
    const n = Date.parse(value + 'T00:00:00Z');
    return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === value ? n : NaN;
  };
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const part = (key: string) => parts.find(p => p.type === key)?.value;
  const today = parse(`${part('year')}-${part('month')}-${part('day')}`);
  const issued = parse(issue), received = parse(receipt);
  if (!Number.isFinite(issued) || !Number.isFinite(received)) return 'Enter valid certificate issue and complete packet receipt dates.';
  if (issued > received || received > today) return 'Certificate issue, actual packet receipt and today must be in chronological order.';
  if (today - issued > 90 * 86400000) return 'Obtain and review an association resale certificate not more than 90 days old.';
  return undefined;
}
