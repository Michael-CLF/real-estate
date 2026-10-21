import { isFederalLeadExcluded } from './state-contracts/federal-lead-policy';
import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
export function iowaRequiredDisclosureTypes(listing: Record<string, unknown>): string[] {
  return [...(!isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [])];
}
/** Initial buyer offers require applicable lead records; state disclosure receipt is enforced for seller offers and acceptance. */
export async function assertIowaListingDisclosures(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void> {
  const missing = await readMissingListingDisclosures(transaction, reference, iowaRequiredDisclosureTypes(listing), doc =>
    !doc || doc['listingUid'] !== reference.id || doc['stateAbbreviation'] !== 'IA' ||
    typeof doc['storagePath'] !== 'string' || !doc['storagePath'] || typeof doc['versionId'] !== 'string' || !doc['versionId']);
  if (missing.length) throw new HttpsError('failed-precondition', `The seller must upload the applicable Iowa documents or signed evidence of a lawful exception before an offer can be created: ${missing.join(', ')}.`);
}
