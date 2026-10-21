/** State-owned mappings; absence of an association is a seller statement, not a buyer receipt. */
export interface HoaApplicabilityPolicy {
  readonly sellerFactPath?: string;
  readonly documentStatusPath?: string;
  readonly documentTypes: readonly string[];
  readonly evidencePaths?: readonly string[];
  readonly snapshotSellerFact?: boolean;
  readonly auditedNoReceiptQuestion?: boolean;
}
export const NO_HOA_SELLER_STATEMENT = 'Seller reports no homeowners association.';
export function readHoaPath(value:unknown,path:string):unknown {
  return path.split('.').reduce<unknown>((parent,key)=>parent && typeof parent==='object' ? (parent as Record<string,unknown>)[key] : undefined,value);
}
export function setHoaPath<T>(value:T,path:string,next:unknown):T {
  const [key,...rest]=path.split('.');
  if(!key || ['__proto__','prototype','constructor'].includes(key))throw new Error('Invalid association policy path.');
  const source=value && typeof value==='object' && !Array.isArray(value) ? value as Record<string,unknown> : {};
  if(!rest.length && source[key]===next && (next!==undefined || !(key in source)))return value;
  const result={...source};
  if(rest.length){const child=setHoaPath(source[key],rest.join('.'),next);if(child===source[key])return value;result[key]=child;}
  else if(next===undefined)delete result[key];else result[key]=next;
  return result as T;
}
export function sellerReportsNoHoa(terms:unknown,policy:HoaApplicabilityPolicy):boolean {
  if(!policy.sellerFactPath || readHoaPath(terms,policy.sellerFactPath)!==false)return false;
  // A physical property label or conflicting condominium ownership never establishes an exclusion.
  return readHoaPath(terms,'property.propertyType')!=='condo' && readHoaPath(terms,'property.contractFacts.isCondominium')!==true;
}
export function normalizeHoaTerms<T>(terms:T,policy:HoaApplicabilityPolicy):T {
  if(!sellerReportsNoHoa(terms,policy) || !policy.documentStatusPath)return terms;
  const status=readHoaPath(terms,policy.documentStatusPath);
  // Keep actual historical receipt evidence, exemption claims and immutable version pins.
  return status===undefined || status===null || status==='unselected' || status==='pending'
    ? setHoaPath(terms,policy.documentStatusPath,'not_applicable') : terms;
}
export function preserveHoaEvidence<T>(current:T,next:T,policy:HoaApplicabilityPolicy):T {
  let result=next;
  for(const path of [policy.sellerFactPath,policy.documentStatusPath,...(policy.evidencePaths ?? []),...policy.documentTypes.map(type=>'documentVersions.'+type)].filter((p):p is string=>Boolean(p))) {
    result=setHoaPath(result,path,readHoaPath(current,path));
  }
  return result;
}

/** An actual optional receipt can remain evidence without becoming an applicability requirement. */
export function projectHoaValidationTerms<T>(terms:T,policy:HoaApplicabilityPolicy):T {
  const prepared=normalizeHoaTerms(terms,policy);
  return sellerReportsNoHoa(prepared,policy) && policy.documentStatusPath && readHoaPath(prepared,policy.documentStatusPath)==='received'
    ? setHoaPath(prepared,policy.documentStatusPath,'not_applicable') : prepared;
}
