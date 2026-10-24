export type NevadaPropertyTimeZone='America/Los_Angeles'|'America/Denver';
export function resolveNevadaPropertyTimeZone(county:string|null|undefined,confirmed?:boolean|string|null):NevadaPropertyTimeZone{if(!county?.trim())throw new Error('The property county is required.');return confirmed===true||confirmed==='America/Denver'?'America/Denver':'America/Los_Angeles';}
