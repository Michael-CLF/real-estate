/** Federal target-housing cutoff. Use original construction year, never renovation year.
 * Invalid/missing historical data is not silently treated as an exemption. */
export function isFederalLeadExcluded(property: {readonly yearBuilt?: unknown; readonly propertyType?: unknown} | null | undefined): boolean {
  return property?.propertyType === 'land' || (typeof property?.yearBuilt === 'number' && Number.isInteger(property.yearBuilt) && property.yearBuilt >= 1978);
}
export interface FederalLeadTermPolicy {
  readonly listingStatementRequired?: boolean;
  readonly values: Readonly<Record<string, unknown>>;
  readonly nonHousingValues?: Readonly<Record<string, unknown>>;
  readonly hiddenFields: readonly string[];
  readonly addendum?: {readonly path:string;readonly idKey:string;readonly id:string;readonly selectedKey:string};
}
function readPath(value:unknown,path:string):unknown {
  return path.split('.').reduce<unknown>((parent,key)=>parent && typeof parent==='object' ? (parent as Record<string,unknown>)[key] : undefined,value);
}
function setPath(value:unknown,keys:readonly string[],next:unknown):unknown {
  const [key,...rest]=keys;
  if(!key || ['__proto__','prototype','constructor'].includes(key))throw new Error('Invalid federal policy path.');
  const source=value && typeof value==='object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
  if(next===undefined && !(key in source))return value;
  const result={...source};
  if(rest.length)result[key]=setPath(source[key],rest,next);
  else if(next===undefined)delete result[key];else result[key]=next;
  return result;
}
/** Pure projection: no receipt, review, signature or inspection waiver is manufactured. */
export function normalizeFederalLeadTerms<T>(terms:T,policy:FederalLeadTermPolicy):T {
  const property=readPath(terms,'property') as {yearBuilt?:unknown;propertyType?:unknown}|undefined;
  if(!property || !isFederalLeadExcluded(property))return terms;
  let result:unknown=terms;
  const values=property.propertyType==='land' ? {...policy.values,...policy.nonHousingValues} : policy.values;
  for(const [path,value] of Object.entries(values))result=setPath(result,path.split('.'),value);
  const selection=policy.addendum;
  if(selection){const rows=readPath(result,selection.path);if(Array.isArray(rows))result=setPath(result,selection.path.split('.'),rows.map(row=>row && typeof row==='object' && row[selection.idKey]===selection.id ? {...row,[selection.selectedKey]:false} : row));}
  return result as T;
}

/** Restore only federal lead evidence when the seller proposes a new price/version. */
export function preserveFederalLeadEvidence<T>(current:T,next:T,policy:FederalLeadTermPolicy):T {
  let result:unknown=next;
  for(const path of Object.keys(policy.values))result=setPath(result,path.split('.'),readPath(current,path));
  const selection=policy.addendum;
  if(selection){const previous=readPath(current,selection.path),rows=readPath(next,selection.path);if(Array.isArray(previous)&&Array.isArray(rows)){
    const lead=previous.find(row=>row?.[selection.idKey]===selection.id);
    const restored=rows.filter(row=>row?.[selection.idKey]!==selection.id);
    if(lead)restored.splice(Math.min(previous.indexOf(lead),restored.length),0,lead);
    result=setPath(result,selection.path.split('.'),restored);
  }}
  return result as T;
}
