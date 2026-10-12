export type MontanaPropertyTimeZone = 'America/Denver';
export function resolveMontanaPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): MontanaPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/Denver';
}
