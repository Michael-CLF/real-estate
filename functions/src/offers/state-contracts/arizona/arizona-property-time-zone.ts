/** Initial coverage excludes counties needing property-level boundary confirmation. */
export type ArizonaPropertyTimeZone = 'America/Phoenix' | 'America/Denver';
export const ARIZONA_COUNTIES = "Apache|Cochise|Coconino|Gila|Graham|Greenlee|La Paz|Maricopa|Mohave|Navajo|Pima|Pinal|Santa Cruz|Yavapai|Yuma".split('|');
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+county$/i, '').replace(/\s+/g, ' ');
export function resolveArizonaPropertyTimeZone(county: string | null | undefined): ArizonaPropertyTimeZone {
 const key = normalize(county ?? '');
 if (!ARIZONA_COUNTIES.some(c => normalize(c) === key)) throw new Error('Provide a recognized Arizona property county.');
 if (["apache", "coconino", "navajo"].includes(key)) throw new Error('This county requires property-level time-zone confirmation and is outside the initial Arizona offer coverage.');
 return 'America/Phoenix';
}
