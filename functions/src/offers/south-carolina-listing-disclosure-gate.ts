import { isFederalLeadExcluded } from './state-contracts/federal-lead-policy';
import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
/** Collect applicable seller records before offers, without changing their statutory deadlines. */
export function southCarolinaRequiredDisclosureTypes(listing: Record<string, unknown>): string[] {
  const statements = (listing['sellerStatements'] ?? {}) as Record<string, unknown>;
  const stateFacts = (statements['southCarolina'] ?? {}) as Record<string, unknown>;
  return [...['south-carolina-property-condition', ...(stateFacts['beachfrontApplies'] === true ? ['south-carolina-coastal-disclosure'] : []), ...(stateFacts['futureVacationBookingsExist'] === true ? ['south-carolina-vacation-rentals'] : [])], ...(!isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [])];
}
export async function assertSouthCarolinaListingDisclosures(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void> {
  const invalid = (doc: Record<string, unknown> | undefined, type: string): boolean => !doc || doc['documentType'] !== type || doc['listingUid'] !== reference.id || doc['stateAbbreviation'] !== 'SC' || typeof doc['storagePath'] !== 'string' || !doc['storagePath'] || typeof doc['versionId'] !== 'string' || !doc['versionId'];
  const missing = await readMissingListingDisclosures(transaction, reference, southCarolinaRequiredDisclosureTypes(listing), invalid);
  if (missing.length) throw new HttpsError('failed-precondition', `The seller must upload the applicable SouthCarolina disclosure or supported lawful exception before offers are available: ${missing.join(', ')}.`);
}
