export type SouthDakotaPropertyTimeZone = 'America/Chicago' | 'America/Denver';
export function resolveSouthDakotaPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): SouthDakotaPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 if (confirmed === true || confirmed === 'America/Denver') return 'America/Denver';
 if (confirmed === false || confirmed === 'America/Chicago') return 'America/Chicago';
 throw new Error('Confirm the property time zone in the listing details before creating an offer.');
}
