import type { IowaOfferTerms } from '../../../../../core/domains/offers/state-contracts/iowa/models/iowa-offer-terms.model';

/** Pin only a new buyer receipt decision; never rebase a saved acknowledgement. */
export function pinIowaReviewedDocumentVersions(
  previous: IowaOfferTerms,
  updated: IowaOfferTerms,
  documents: readonly {documentType: string; versionId?: string | null}[],
): IowaOfferTerms {
  if (!updated.disclosurePolicyRevision) return updated;
  const pins = {...previous.documentVersions};
  for (const [field, type] of [
    ['propertyConditionStatus', 'iowa-seller-disclosure'],
    ['statutoryPacketStatus', 'iowa-statutory-packet'],
    ['hoaDocumentsStatus', 'iowa-association-documents'],
    ['leadPaintStatus', 'lead-based-paint'],
  ] as const) {
    if (previous.disclosures[field] === updated.disclosures[field]) continue;
    const status = updated.disclosures[field];
    const version = documents.find(document => document.documentType === type)?.versionId;
    if ((status === 'received' || status === 'exempt') && version) pins[type] = version;
    else delete pins[type];
  }
  return {...updated, documentVersions:pins};
}
