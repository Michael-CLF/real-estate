import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';

export function floridaRequiredDisclosureTypes(
  listing: Record<string, unknown>,
): string[] {
  const statements = listing['sellerStatements'] as Record<string, unknown> | undefined;
  const yearBuilt = listing['yearBuilt'];
  return [
    'florida-flood-disclosure',
    ...(statements?.['ownersAssociationApplies'] === true
      ? ['florida-hoa-disclosure-summary'] : []),
    ...(statements?.['leadBasedPaintApplies'] === true ||
      (typeof yearBuilt === 'number' && yearBuilt < 1978 && statements?.['leadBasedPaintApplies'] !== false)
      ? ['lead-based-paint'] : []),
  ];
}

/** Read documents in the same transaction as offer creation or submission. */
export async function assertFloridaListingDisclosures(
  transaction: Transaction,
  listingReference: DocumentReference,
  listing: Record<string, unknown>,
): Promise<void> {
  const required = floridaRequiredDisclosureTypes(listing);
  const missing = await readMissingListingDisclosures(transaction, listingReference, required, document => {
    return !document || document['listingUid'] !== listingReference.id ||
      document['stateAbbreviation'] !== 'FL' ||
      typeof document['storagePath'] !== 'string' || !document['storagePath'] ||
      typeof document['versionId'] !== 'string' || !document['versionId'];
  });
  if (missing.length) {
    throw new HttpsError('failed-precondition',
      `This Florida listing is waiting for the seller to upload: ${missing.map(type => type.replace(/-/g, ' ')).join(', ')}. Open Property Disclosures from the seller's listing dashboard.`);
  }
}