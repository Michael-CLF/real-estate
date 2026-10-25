export type VirginiaPropertyTimeZone='America/New_York';
export function resolveVirginiaPropertyTimeZone(county:string|null|undefined,confirmed?:boolean|string|null):VirginiaPropertyTimeZone{if(!county?.trim())throw new Error('The property county is required.');return 'America/New_York';}
