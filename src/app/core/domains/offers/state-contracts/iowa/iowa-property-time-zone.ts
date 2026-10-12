export type IowaPropertyTimeZone = 'America/Chicago';
export function resolveIowaPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): IowaPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/Chicago';
}
