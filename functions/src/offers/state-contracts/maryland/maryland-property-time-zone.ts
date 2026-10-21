export type MarylandPropertyTimeZone = 'America/New_York';
export function resolveMarylandPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): MarylandPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/New_York';
}
