/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const TENNESSEE_DOCUMENT_RULES = {
  templateUid: 'navstreet-tn-residential-2026',
  version: '2026-10-24',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['tennessee-statutory-packet', 'tennessee-seller-disclosure', 'tennessee-association-documents', 'lead-based-paint'],
} as const;
