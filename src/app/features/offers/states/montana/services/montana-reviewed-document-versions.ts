import type { MontanaOfferTerms } from '../../../../../core/domains/offers/state-contracts/montana/models/montana-offer-terms.model';

/** Pin only a new buyer receipt decision; never rebase a saved acknowledgement. */
export function pinMontanaReviewedDocumentVersions(
  previous: MontanaOfferTerms,
  updated: MontanaOfferTerms,
  documents: readonly {documentType: string; versionId?: string | null}[],
): MontanaOfferTerms {
  if (updated.contractType !== 'navstreet_montana_condominium_resale_2026') return updated;
  const pins = {...previous.documentVersions};
  for (const [field, type] of [
    ['propertyConditionStatus', 'montana-seller-disclosure'],
    ['statutoryPacketStatus', 'montana-statutory-packet'],
    ['hoaDocumentsStatus', 'montana-association-documents'],
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
