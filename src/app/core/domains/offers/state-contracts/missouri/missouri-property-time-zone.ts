export type MissouriPropertyTimeZone = 'America/Chicago';
export function resolveMissouriPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): MissouriPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/Chicago';
}
