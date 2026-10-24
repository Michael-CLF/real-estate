export type PennsylvaniaPropertyTimeZone='America/New_York';
export function resolvePennsylvaniaPropertyTimeZone(county:string|null|undefined,confirmed?:boolean|string|null):PennsylvaniaPropertyTimeZone{if(!county?.trim())throw new Error('The property county is required.');return 'America/New_York';}
