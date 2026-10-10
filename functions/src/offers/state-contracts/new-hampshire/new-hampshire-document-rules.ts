/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const NEW_HAMPSHIRE_DOCUMENT_RULES = {
  templateUid: 'navstreet-nh-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['new-hampshire-statutory-packet', 'new-hampshire-seller-disclosure', 'new-hampshire-association-documents', 'lead-based-paint'],
} as const;
