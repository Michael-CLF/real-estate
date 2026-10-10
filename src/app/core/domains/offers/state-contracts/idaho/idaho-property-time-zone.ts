/** Initial coverage excludes counties needing property-level boundary confirmation. */
export type IdahoPropertyTimeZone = 'America/Boise' | 'America/Los_Angeles';
export const IDAHO_COUNTIES = "Ada|Adams|Bannock|Bear Lake|Benewah|Bingham|Blaine|Boise|Bonner|Bonneville|Boundary|Butte|Camas|Canyon|Caribou|Cassia|Clark|Clearwater|Custer|Elmore|Franklin|Fremont|Gem|Gooding|Idaho|Jefferson|Jerome|Kootenai|Latah|Lemhi|Lewis|Lincoln|Madison|Minidoka|Nez Perce|Oneida|Owyhee|Payette|Power|Shoshone|Teton|Twin Falls|Valley|Washington".split('|');
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+county$/i, '').replace(/\s+/g, ' ');
export function resolveIdahoPropertyTimeZone(county: string | null | undefined): IdahoPropertyTimeZone {
 const key = normalize(county ?? '');
 if (!IDAHO_COUNTIES.some(c => normalize(c) === key)) throw new Error('Provide a recognized Idaho property county.');
 if (["idaho"].includes(key)) throw new Error('This county requires property-level time-zone confirmation and is outside the initial Idaho offer coverage.');
 return ["benewah", "bonner", "boundary", "clearwater", "kootenai", "latah", "lewis", "nez perce", "shoshone"].includes(key) ? 'America/Los_Angeles' : 'America/Boise';
}
