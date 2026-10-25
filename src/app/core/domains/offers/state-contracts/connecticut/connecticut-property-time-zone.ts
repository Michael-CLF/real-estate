export type ConnecticutPropertyTimeZone='America/New_York';
export function resolveConnecticutPropertyTimeZone(county:string|null|undefined,confirmed?:boolean|string|null):ConnecticutPropertyTimeZone{if(!county?.trim())throw new Error('The property county is required.');return 'America/New_York';}
