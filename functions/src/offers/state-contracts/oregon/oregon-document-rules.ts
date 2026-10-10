/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const OREGON_DOCUMENT_RULES = {
  templateUid: 'navstreet-or-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['oregon-statutory-packet', 'oregon-seller-disclosure', 'oregon-association-documents', 'lead-based-paint'],
} as const;
