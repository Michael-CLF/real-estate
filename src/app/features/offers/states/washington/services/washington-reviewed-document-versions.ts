import type { WashingtonOfferTerms } from '../../../../../core/domains/offers/state-contracts/washington/models/washington-offer-terms.model';

/** Pin only a new buyer receipt decision; never rebase a saved acknowledgement. */
export function pinWashingtonReviewedDocumentVersions(
  previous: WashingtonOfferTerms,
  updated: WashingtonOfferTerms,
  documents: readonly {documentType: string; versionId?: string | null}[],
): WashingtonOfferTerms {
  if (updated.contractType !== 'navstreet_washington_condominium_resale_2026') return updated;
  const pins = {...previous.documentVersions};
  for (const [field, type] of [
    ['propertyConditionStatus', 'washington-seller-disclosure'],
    ['statutoryPacketStatus', 'washington-statutory-packet'],
    ['hoaDocumentsStatus', 'washington-association-documents'],
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
