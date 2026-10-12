export type WashingtonPropertyTimeZone = 'America/Los_Angeles';
export function resolveWashingtonPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): WashingtonPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 return 'America/Los_Angeles';
}
