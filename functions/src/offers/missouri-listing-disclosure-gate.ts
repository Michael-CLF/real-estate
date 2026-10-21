import { isFederalLeadExcluded } from './state-contracts/federal-lead-policy';
import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
export function missouriRequiredDisclosureTypes(listing: Record<string, unknown>): string[] {
  const statements = listing['sellerStatements'] as Record<string, unknown> | undefined;
  const facts = statements?.['missouri'] as Record<string, unknown> | undefined;
  return [
    ...(facts?.['methProductionKnown'] !== false || facts?.['drugConvictionKnown'] !== false ? ['missouri-statutory-packet'] : []),
    
    ...(listing['propertyType'] !== 'land' && (!isFederalLeadExcluded(listing)) ? ['lead-based-paint'] : [])];
}
/** Only required applicable documents gate draft creation; statutory exceptions require supporting evidence. */
export async function assertMissouriListingDisclosures(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void> {
  const missing = await readMissingListingDisclosures(transaction, reference, missouriRequiredDisclosureTypes(listing), doc =>
    !doc || doc['listingUid'] !== reference.id || doc['stateAbbreviation'] !== 'MO' ||
    typeof doc['storagePath'] !== 'string' || !doc['storagePath'] || typeof doc['versionId'] !== 'string' || !doc['versionId']);
  if (missing.length) throw new HttpsError('failed-precondition', `The seller must upload the applicable Missouri documents or signed evidence of a lawful exception before an offer can be created: ${missing.join(', ')}.`);
}
