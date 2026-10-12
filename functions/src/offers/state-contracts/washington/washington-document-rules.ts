/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const WASHINGTON_DOCUMENT_RULES = {
  templateUid: 'navstreet-wa-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['washington-statutory-packet', 'washington-seller-disclosure', 'washington-association-documents', 'lead-based-paint'],
} as const;
