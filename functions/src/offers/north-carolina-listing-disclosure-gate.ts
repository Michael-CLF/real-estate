import { isFederalLeadExcluded } from './state-contracts/federal-lead-policy';
import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
/** Collect applicable seller records before offers, without changing their statutory deadlines. */
export function northCarolinaRequiredDisclosureTypes(listing: Record<string, unknown>): string[] {
  return [...['residential-property-owners-association', 'mineral-oil-gas-rights'], ...(!isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [])];
}
export async function assertNorthCarolinaListingDisclosures(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void> {
  const invalid = (doc: Record<string, unknown> | undefined, type: string): boolean => !doc || doc['documentType'] !== type || doc['listingUid'] !== reference.id || doc['stateAbbreviation'] !== 'NC' || typeof doc['storagePath'] !== 'string' || !doc['storagePath'] || typeof doc['versionId'] !== 'string' || !doc['versionId'];
  const missing = await readMissingListingDisclosures(transaction, reference, northCarolinaRequiredDisclosureTypes(listing), invalid);
  if (missing.length) throw new HttpsError('failed-precondition', `The seller must upload the applicable NorthCarolina disclosure or supported lawful exception before offers are available: ${missing.join(', ')}.`);
}
