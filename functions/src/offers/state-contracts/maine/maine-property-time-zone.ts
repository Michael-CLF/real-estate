export type MainePropertyTimeZone = 'America/New_York';
export function resolveMainePropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): MainePropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/New_York';
}
