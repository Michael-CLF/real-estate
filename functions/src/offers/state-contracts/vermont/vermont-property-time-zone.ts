export type VermontPropertyTimeZone='America/New_York';
export function resolveVermontPropertyTimeZone(county:string|null|undefined,confirmed?:boolean|string|null):VermontPropertyTimeZone{if(!county?.trim())throw new Error('The property county is required.');return 'America/New_York';}
