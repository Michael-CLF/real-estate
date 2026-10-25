export type TennesseePropertyTimeZone='America/New_York'|'America/Chicago';
export function resolveTennesseePropertyTimeZone(county:string|null|undefined,confirmed?:boolean|string|null):TennesseePropertyTimeZone{if(!county?.trim())throw new Error('The property county is required.');return confirmed===true||confirmed==='America/Chicago'?'America/Chicago':'America/New_York';}
