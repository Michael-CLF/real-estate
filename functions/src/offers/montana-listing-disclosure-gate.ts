import { isFederalLeadExcluded } from './state-contracts/federal-lead-policy';
import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
export function montanaRequiredDisclosureTypes(listing: Record<string, unknown>): string[] {
  const statements = listing['sellerStatements'] as Record<string, unknown> | undefined;
  const stateFacts = statements?.['montana'] as Record<string,unknown> | undefined;
  return ['montana-seller-disclosure',...(stateFacts?.['radonTestsKnown'] !== false || stateFacts?.['drugContaminationKnown'] !== false || stateFacts?.['appurtenantWaterRightsKnown'] !== false ? ['montana-statutory-packet'] : []),...(!isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [])];
}
/** NavStreet requires the applicable packet before draft creation; statutory exceptions need signed supporting evidence. */
export async function assertMontanaListingDisclosures(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void> {
  const missing = await readMissingListingDisclosures(transaction, reference, montanaRequiredDisclosureTypes(listing), doc =>
    !doc || doc['listingUid'] !== reference.id || doc['stateAbbreviation'] !== 'MT' ||
    typeof doc['storagePath'] !== 'string' || !doc['storagePath'] || typeof doc['versionId'] !== 'string' || !doc['versionId']);
  if (missing.length) throw new HttpsError('failed-precondition', `The seller must upload the applicable Montana documents or signed evidence of a lawful exception before an offer can be created: ${missing.join(', ')}.`);
}
