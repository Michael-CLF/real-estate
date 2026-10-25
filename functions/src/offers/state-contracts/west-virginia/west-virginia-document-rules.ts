/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const WEST_VIRGINIA_DOCUMENT_RULES = {
  templateUid: 'navstreet-wv-residential-2026',
  version: '2026-10-24',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['west-virginia-statutory-packet', 'west-virginia-seller-disclosure', 'west-virginia-association-documents', 'lead-based-paint'],
} as const;
