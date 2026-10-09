import type { DocumentReference, Transaction } from 'firebase-admin/firestore';

/** Reads the requested current documents in the caller's offer transaction.
 * State wrappers retain ownership of document validity and missing-file errors.
 */
export async function readMissingListingDisclosures(
  transaction: Transaction,
  listingReference: DocumentReference,
  required: readonly string[],
  isInvalid: (document: Record<string, unknown> | undefined) => boolean,
): Promise<string[]> {
  const snapshots = await Promise.all(required.map(type =>
    transaction.get(listingReference.collection('disclosures').doc(type)),
  ));
  return required.filter((_type, index) => isInvalid(
    snapshots[index].data()?.['currentDocument'] as Record<string, unknown> | undefined,
  ));
}
