/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const WYOMING_DOCUMENT_RULES = {
  templateUid: 'navstreet-wy-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['wyoming-statutory-packet', 'wyoming-seller-disclosure', 'wyoming-association-documents', 'lead-based-paint'],
} as const;
