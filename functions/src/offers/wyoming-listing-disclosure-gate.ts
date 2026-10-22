import { isFederalLeadExcluded } from './state-contracts/federal-lead-policy';
import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
export function wyomingRequiredDisclosureTypes(listing: Record<string, unknown>): string[] {
  return [...(false ? ['wyoming-statutory-packet'] : []),...(!isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [])];
}
/** NavStreet requires the applicable packet before draft creation; statutory exceptions need signed supporting evidence. */
export async function assertWyomingListingDisclosures(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void> {
  const missing = await readMissingListingDisclosures(transaction, reference, wyomingRequiredDisclosureTypes(listing), (doc, documentType) =>
    !doc || doc['documentType'] !== documentType || doc['listingUid'] !== reference.id || doc['stateAbbreviation'] !== 'WY' ||
    typeof doc['storagePath'] !== 'string' || !doc['storagePath'] || typeof doc['versionId'] !== 'string' || !doc['versionId']);
  if (missing.length) throw new HttpsError('failed-precondition', `The seller must upload the applicable Wyoming documents or signed evidence of a lawful exception before an offer can be created: ${missing.join(', ')}.`);
}
