export type OhioPropertyTimeZone = 'America/New_York';
export function resolveOhioPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): OhioPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/New_York';
}
