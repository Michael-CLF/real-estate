export type NewMexicoPropertyTimeZone = 'America/Denver';
export function resolveNewMexicoPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): NewMexicoPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/Denver';
}
