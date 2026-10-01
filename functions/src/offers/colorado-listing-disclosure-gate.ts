import { HttpsError } from 'firebase-functions/v2/https';

import type {
  DocumentReference,
  Transaction,
} from 'firebase-admin/firestore';

export function coloradoRequiredDisclosureTypes(
  listing: Record<string, unknown>,
): string[] {
  const statements = listing['sellerStatements'] as
    | Record<string, unknown>
    | undefined;

  return [
    'colorado-property-disclosure',
    'colorado-radon-brochure',

    ...(listing['yearBuilt'] == null ||
    Number(listing['yearBuilt']) < 1978 ||
    statements?.['leadBasedPaintApplies'] === true
      ? ['lead-based-paint']
      : []),
  ];
}

/** Check Colorado documents required before offer creation. */
export async function assertColoradoListingDisclosures(
  transaction: Transaction,
  listingReference: DocumentReference,
  listing: Record<string, unknown>,
): Promise<void> {
  const required = coloradoRequiredDisclosureTypes(listing);

  const snapshots = await Promise.all(
    required.map(documentType =>
      transaction.get(
        listingReference
          .collection('disclosures')
          .doc(documentType),
      ),
    ),
  );

  const missing = required.filter((documentType, index) => {
    const file = snapshots[index].data()?.['currentDocument'] as
      | Record<string, unknown>
      | undefined;

    return (
      !file ||
      file['listingUid'] !== listingReference.id ||
      file['stateAbbreviation'] !== 'CO' ||
      !file['storagePath'] ||
      !file['versionId']
    );
  });

  if (missing.length) {
    throw new HttpsError(
      'failed-precondition',
      `The seller must upload ${missing
        .map(documentType => documentType.replace(/-/g, ' '))
        .join(', ')} in Property Disclosures before an offer can be made.`,
    );
  }
}