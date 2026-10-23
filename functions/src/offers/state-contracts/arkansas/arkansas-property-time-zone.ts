export type ArkansasPropertyTimeZone = 'America/Chicago';
export function resolveArkansasPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): ArkansasPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/Chicago';
}
