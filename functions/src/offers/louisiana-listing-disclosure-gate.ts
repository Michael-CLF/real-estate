import { isFederalLeadExcluded } from './state-contracts/federal-lead-policy';
import { readMissingListingDisclosures } from './listing-disclosure-gate-reader';
import { HttpsError } from 'firebase-functions/v2/https';
import type { DocumentReference, Transaction } from 'firebase-admin/firestore';

export const LOUISIANA_VACANT_DISCLOSURE_EFFECTIVE_AT =
  Date.parse('2027-01-01T06:00:00Z');

export function louisianaRequiredDisclosureTypes(
  listing: Record<string, unknown>,
  now = new Date(),
): string[] {
  if (listing['propertyType'] === 'land') {
    return now.getTime() >= LOUISIANA_VACANT_DISCLOSURE_EFFECTIVE_AT
      ? ['louisiana-vacant-residential-property-disclosure']
      : [];
  }

  return [
    'louisiana-property-disclosure',
    ...(
      !isFederalLeadExcluded(listing)
        ? ['lead-based-paint']
        : []
    ),
  ];
}

export async function assertLouisianaListingDisclosures(
  transaction: Transaction,
  listingReference: DocumentReference,
  listing: Record<string, unknown>,
): Promise<void> {
  const required = louisianaRequiredDisclosureTypes(listing);

  const missing = await readMissingListingDisclosures(transaction, listingReference, required, document => {
    return !document ||
      document['listingUid'] !== listingReference.id ||
      document['stateAbbreviation'] !== 'LA' ||
      typeof document['storagePath'] !== 'string' ||
      !document['storagePath'] ||
      typeof document['versionId'] !== 'string' ||
      !document['versionId'];
  });

  if (missing.length) {
    throw new HttpsError(
      'failed-precondition',
      `This Louisiana listing is waiting for the seller to upload: ${
        missing.map(type => type.replace(/-/g, ' ')).join(', ')
      }. Open Property Disclosures from the seller's listing dashboard.`,
    );
  }
}