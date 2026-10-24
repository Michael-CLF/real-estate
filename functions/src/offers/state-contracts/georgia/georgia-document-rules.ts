/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const GEORGIA_DOCUMENT_RULES = {
  templateUid: 'navstreet-ga-residential-2026',
  version: '2026-10-24',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['georgia-statutory-packet', 'georgia-seller-disclosure', 'georgia-association-documents', 'lead-based-paint'],
} as const;
