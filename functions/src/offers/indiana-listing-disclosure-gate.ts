import { isFederalLeadExcluded } from './state-contracts/federal-lead-policy';
import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
export function indianaRequiredDisclosureTypes(listing: Record<string, unknown>): string[] {
  return [
    'indiana-seller-disclosure',
    ...(!isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [])];
}
/** NavStreet requires the condition form or supported exception evidence before offer entry. */
export async function assertIndianaListingDisclosures(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void> {
  const missing = await readMissingListingDisclosures(transaction, reference, indianaRequiredDisclosureTypes(listing), doc =>
    !doc || doc['listingUid'] !== reference.id || doc['stateAbbreviation'] !== 'IN' ||
    typeof doc['storagePath'] !== 'string' || !doc['storagePath'] || typeof doc['versionId'] !== 'string' || !doc['versionId']);
  if (missing.length) throw new HttpsError('failed-precondition', `The seller must upload the Indiana condition disclosure or supported exception evidence and any applicable federal lead documents before an offer can be created: ${missing.join(', ')}.`);
}
