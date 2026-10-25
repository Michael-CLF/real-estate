/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const RHODE_ISLAND_DOCUMENT_RULES = {
  templateUid: 'navstreet-ri-residential-2026',
  version: '2026-10-24',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['rhode-island-statutory-packet', 'rhode-island-seller-disclosure', 'rhode-island-association-documents', 'lead-based-paint'],
} as const;
