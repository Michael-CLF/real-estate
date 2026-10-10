export type NewHampshirePropertyTimeZone = 'America/New_York';
export function resolveNewHampshirePropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): NewHampshirePropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/New_York';
}
