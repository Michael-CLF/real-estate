export type IllinoisPropertyTimeZone = 'America/Chicago';
export function resolveIllinoisPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): IllinoisPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/Chicago';
}
