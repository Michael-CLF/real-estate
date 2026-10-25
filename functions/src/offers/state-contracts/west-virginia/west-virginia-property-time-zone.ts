export type WestVirginiaPropertyTimeZone='America/New_York';
export function resolveWestVirginiaPropertyTimeZone(county:string|null|undefined,confirmed?:boolean|string|null):WestVirginiaPropertyTimeZone{if(!county?.trim())throw new Error('The property county is required.');return 'America/New_York';}
