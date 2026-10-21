import { isFederalLeadExcluded } from './state-contracts/federal-lead-policy';
import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
export function southDakotaRequiredDisclosureTypes(listing: Record<string, unknown>): string[] {
  const statements = listing['sellerStatements'] as Record<string, unknown> | undefined;
  const stateFacts = statements?.['southDakota'] as Record<string,unknown> | undefined;
  return ['south-dakota-seller-disclosure',...(stateFacts?.['disclosureExemptionClaimed'] === true && stateFacts?.['privateTransferFeeKnown'] !== false ? ['south-dakota-statutory-packet'] : []),...(statements?.['ownersAssociationApplies'] === true ? ['south-dakota-association-documents'] : []),...(!isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [])];
}
/** NavStreet requires the applicable packet before draft creation; statutory exceptions need signed supporting evidence. */
export async function assertSouthDakotaListingDisclosures(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void> {
  const missing = await readMissingListingDisclosures(transaction, reference, southDakotaRequiredDisclosureTypes(listing), doc =>
    !doc || doc['listingUid'] !== reference.id || doc['stateAbbreviation'] !== 'SD' ||
    typeof doc['storagePath'] !== 'string' || !doc['storagePath'] || typeof doc['versionId'] !== 'string' || !doc['versionId']);
  if (missing.length) throw new HttpsError('failed-precondition', `The seller must upload the applicable SouthDakota documents or signed evidence of a lawful exception before an offer can be created: ${missing.join(', ')}.`);
}
