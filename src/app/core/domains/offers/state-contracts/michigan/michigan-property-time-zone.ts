/** County authority: Michigan.gov county directory; zone boundary: 49 CFR 71.5(a).
 * Keep frontend/backend copies equal; verify-minnesota-michigan.cjs checks parity.
 */
export type MichiganPropertyTimeZone = 'America/Detroit' | 'America/Chicago';
const normalizeCounty = (value: string): string => value.trim().toLowerCase().replace(/\s+county$/i, '').replace(/^saint\s+/, 'st ').replace(/\./g, '').replace(/\s+/g, ' ');
export const MICHIGAN_COUNTIES: readonly string[] = 'Alcona|Alger|Allegan|Alpena|Antrim|Arenac|Baraga|Barry|Bay|Benzie|Berrien|Branch|Calhoun|Cass|Charlevoix|Cheboygan|Chippewa|Clare|Clinton|Crawford|Delta|Dickinson|Eaton|Emmet|Genesee|Gladwin|Gogebic|Grand Traverse|Gratiot|Hillsdale|Houghton|Huron|Ingham|Ionia|Iosco|Iron|Isabella|Jackson|Kalamazoo|Kalkaska|Kent|Keweenaw|Lake|Lapeer|Leelanau|Lenawee|Livingston|Luce|Mackinac|Macomb|Manistee|Marquette|Mason|Mecosta|Menominee|Midland|Missaukee|Monroe|Montcalm|Montmorency|Muskegon|Newaygo|Oakland|Oceana|Ogemaw|Ontonagon|Osceola|Oscoda|Otsego|Ottawa|Presque Isle|Roscommon|Saginaw|St. Clair|St. Joseph|Sanilac|Schoolcraft|Shiawassee|Tuscola|Van Buren|Washtenaw|Wayne|Wexford'.split('|');
const counties = new Set(MICHIGAN_COUNTIES.map(normalizeCounty));
const central = new Set(['gogebic', 'iron', 'dickinson', 'menominee']);
export function resolveMichiganPropertyTimeZone(county: string | null | undefined): MichiganPropertyTimeZone {
  const name = normalizeCounty(county ?? '');
  if (!counties.has(name)) throw new Error('The seller must provide a recognized Michigan county before an offer can be created.');
  return central.has(name) ? 'America/Chicago' : 'America/Detroit';
}
