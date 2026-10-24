/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const PENNSYLVANIA_DOCUMENT_RULES = {
  templateUid: 'navstreet-pa-residential-2026',
  version: '2026-10-24',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['pennsylvania-statutory-packet', 'pennsylvania-seller-disclosure', 'pennsylvania-association-documents', 'lead-based-paint'],
} as const;
