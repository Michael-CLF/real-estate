export type IndianaPropertyTimeZone = 'America/Indiana/Indianapolis' | 'America/Chicago';
export function resolveIndianaPropertyTimeZone(county: string | null | undefined, confirmed?: boolean | string | null): IndianaPropertyTimeZone {
 if (!county?.trim()) throw new Error('The property county is required.');
 if (confirmed === true || confirmed === 'America/Chicago') return 'America/Chicago';
 if (confirmed === false || confirmed === 'America/Indiana/Indianapolis') return 'America/Indiana/Indianapolis';
 throw new Error('Confirm the property time zone in the listing details before creating an offer.');
}
