/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const ARKANSAS_DOCUMENT_RULES = {
  templateUid: 'navstreet-ar-residential-2026',
  version: '2026-10-23',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['arkansas-statutory-packet', 'arkansas-seller-disclosure', 'arkansas-association-documents', 'lead-based-paint'],
} as const;
