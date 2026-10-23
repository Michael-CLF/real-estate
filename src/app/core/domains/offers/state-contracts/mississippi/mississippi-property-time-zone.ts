export type MississippiPropertyTimeZone = 'America/Chicago';
export function resolveMississippiPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): MississippiPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/Chicago';
}
