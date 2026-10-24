export type GeorgiaPropertyTimeZone='America/New_York';
export function resolveGeorgiaPropertyTimeZone(county:string|null|undefined,confirmed?:boolean|string|null):GeorgiaPropertyTimeZone{if(!county?.trim())throw new Error('The property county is required.');return 'America/New_York';}
