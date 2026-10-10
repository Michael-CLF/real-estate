export type OregonPropertyTimeZone = 'America/Los_Angeles' | 'America/Denver';
export function resolveOregonPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): OregonPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 if (confirmed === true || confirmed === 'America/Denver') return 'America/Denver';
 if (confirmed === false || confirmed === 'America/Los_Angeles') return 'America/Los_Angeles';
 throw new Error('Confirm the property time zone in the listing details before creating an offer.');
}
