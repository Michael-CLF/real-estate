export type DelawarePropertyTimeZone = 'America/New_York';
export function resolveDelawarePropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): DelawarePropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/New_York';
}
