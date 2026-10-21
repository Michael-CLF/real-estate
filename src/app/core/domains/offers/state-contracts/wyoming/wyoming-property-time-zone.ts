export type WyomingPropertyTimeZone = 'America/Denver';
export function resolveWyomingPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): WyomingPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/Denver';
}
