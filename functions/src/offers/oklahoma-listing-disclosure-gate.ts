import { isFederalLeadExcluded } from './state-contracts/federal-lead-policy';
import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';
export const OKLAHOMA_CONDITION_ROUTES = ['oklahoma-property-condition-disclosure', 'oklahoma-property-condition-disclaimer', 'oklahoma-property-condition-exemption'];
/** Collect applicable seller records before offers, without changing their statutory deadlines. */
export function oklahomaRequiredDisclosureTypes(listing: Record<string, unknown>, available: readonly string[] = []): string[] {
  return [...[available.find(type => OKLAHOMA_CONDITION_ROUTES.includes(type)) ?? OKLAHOMA_CONDITION_ROUTES[0]], ...(!isFederalLeadExcluded(listing) ? ['lead-based-paint'] : [])];
}
export async function assertOklahomaListingDisclosures(transaction: Transaction, reference: DocumentReference, listing: Record<string, unknown>): Promise<void> {
  const invalid = (doc: Record<string, unknown> | undefined, type: string): boolean => !doc || doc['documentType'] !== type || doc['listingUid'] !== reference.id || doc['stateAbbreviation'] !== 'OK' || typeof doc['storagePath'] !== 'string' || !doc['storagePath'] || typeof doc['versionId'] !== 'string' || !doc['versionId'];
  const candidates = await Promise.all(OKLAHOMA_CONDITION_ROUTES.map(type => transaction.get(reference.collection('disclosures').doc(type))));
  const available = OKLAHOMA_CONDITION_ROUTES.filter((type,index) => !invalid(candidates[index].data()?.['currentDocument'] as Record<string, unknown> | undefined, type));
  const missing = await readMissingListingDisclosures(transaction, reference, oklahomaRequiredDisclosureTypes(listing, available), invalid);
  if (missing.length) throw new HttpsError('failed-precondition', `The seller must upload the applicable Oklahoma disclosure or supported lawful exception before offers are available: ${missing.join(', ')}.`);
}
