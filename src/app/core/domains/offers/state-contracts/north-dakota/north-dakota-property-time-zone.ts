export type NorthDakotaPropertyTimeZone='America/Chicago'|'America/Denver';
export function resolveNorthDakotaPropertyTimeZone(county:string|null|undefined,confirmed?:boolean|string|null):NorthDakotaPropertyTimeZone{if(!county?.trim())throw new Error('The property county is required.');return confirmed===true||confirmed==='America/Denver'?'America/Denver':'America/Chicago';}
