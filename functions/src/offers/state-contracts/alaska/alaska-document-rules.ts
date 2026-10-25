/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const ALASKA_DOCUMENT_RULES = {
  templateUid: 'navstreet-ak-residential-2026',
  version: '2026-10-25',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['alaska-statutory-packet', 'alaska-seller-disclosure', 'alaska-association-documents', 'lead-based-paint'],
} as const;
