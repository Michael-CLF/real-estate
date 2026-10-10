/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const ARIZONA_DOCUMENT_RULES = {
  templateUid: 'navstreet-az-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['arizona-statutory-packet', 'arizona-seller-disclosure', 'arizona-association-documents', 'lead-based-paint'],
} as const;
