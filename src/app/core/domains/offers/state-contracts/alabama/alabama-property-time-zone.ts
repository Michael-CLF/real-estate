export type AlabamaPropertyTimeZone = 'America/Chicago' | 'America/New_York';
export function resolveAlabamaPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): AlabamaPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 if (confirmed === true || confirmed === 'America/New_York') return 'America/New_York';
 if (confirmed === false || confirmed === 'America/Chicago') return 'America/Chicago';
 throw new Error('Confirm the property time zone in the listing details before creating an offer.');
}
