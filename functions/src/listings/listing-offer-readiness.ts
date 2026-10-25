/** Readiness is a display hint only. Offer creation/submission always rechecks current records.
 * Bump POLICY_REVISION whenever an upload gate changes, including future state additions.
 */
export const OFFER_READINESS_POLICY_REVISION = '2026-10-25.v2';
export const OFFER_READINESS_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export interface ListingOfferReadiness {
  schemaVersion: 1;
  policyRevision: string;
  listingUid: string;
  stateCode: string;
  ready: boolean;
  inputKey: string;
  checkedAtMillis: number;
  expiresAtMillis: number;
}
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function readinessStateCode(listing: Record<string, unknown>): string {
  const address=record(listing['address']);
  for (const candidate of [listing['state'],listing['stateAbbreviation'],address['stateAbbreviation'],address['state']]) {
    if (typeof candidate==='string' && /^[A-Z]{2}$/.test(candidate.trim().toUpperCase())) return candidate.trim().toUpperCase();
  }
  return '';
}
/** Exact canonical comparison key, not an authorization token. Contains no disclosure contents. */
export function offerReadinessInputKey(listing: Record<string, unknown>): string {
  let tooDeep=false;
  function canonical(value: unknown, depth=0): unknown {
    if (depth>16) {tooDeep=true;return null;}
    if (value==null || typeof value==='boolean' || typeof value==='string') return value ?? null;
    if (typeof value==='number') return Number.isFinite(value) ? value : null;
    if (Array.isArray(value)) return value.map(v=>canonical(v,depth+1));
    if (typeof value==='object') {
      const object=record(value);
      // Both browser and Admin Firestore Timestamp implementations expose this method.
      if (typeof object['toMillis']==='function') return (object['toMillis'] as ()=>number).call(value);
      return Object.fromEntries(Object.keys(object).sort().filter(k=>object[k]!==undefined).map(k=>[k,canonical(object[k],depth+1)]));
    }
    return null;
  }
  const facts=Object.fromEntries(['status','state','stateAbbreviation','address','propertyType','yearBuilt','sellerStatements','hoa','propertyDetails','construction','coloradoPropertyFacts'].map(k=>[k,listing[k]??null]));
  // Additional signer contact information has no role in seller-document availability.
  if (facts['sellerStatements'] && typeof facts['sellerStatements']==='object') {
    facts['sellerStatements']={...record(facts['sellerStatements'])};
    delete (facts['sellerStatements'] as Record<string, unknown>)['additionalSeller'];
  }
  const key=JSON.stringify(canonical(facts));
  return !tooDeep && key.length<=16000 ? key : '';
}
export function readListingOfferReadiness(value: unknown, listingUid: string, listing: Record<string, unknown>, now=Date.now()): ListingOfferReadiness | undefined {
  const row=record(value);
  if (row['schemaVersion']!==1 || row['policyRevision']!==OFFER_READINESS_POLICY_REVISION || row['listingUid']!==listingUid || row['stateCode']!==readinessStateCode(listing) || typeof row['ready']!=='boolean' || !row['inputKey'] || row['inputKey']!==offerReadinessInputKey(listing)) return undefined;
  const checked=row['checkedAtMillis'],expires=row['expiresAtMillis'];
  if (typeof checked!=='number'||typeof expires!=='number'||!Number.isFinite(checked)||!Number.isFinite(expires)||checked>now+30000||expires<=now||expires<=checked||expires-checked>OFFER_READINESS_MAX_AGE_MS) return undefined;
  return row as unknown as ListingOfferReadiness;
}
