export type RhodeIslandPropertyTimeZone='America/New_York';
export function resolveRhodeIslandPropertyTimeZone(county:string|null|undefined,confirmed?:boolean|string|null):RhodeIslandPropertyTimeZone{if(!county?.trim())throw new Error('The property county is required.');return 'America/New_York';}
