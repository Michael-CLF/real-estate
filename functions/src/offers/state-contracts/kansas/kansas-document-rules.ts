/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const KANSAS_DOCUMENT_RULES = {
  templateUid: 'navstreet-ks-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['kansas-statutory-packet', 'kansas-seller-disclosure', 'kansas-association-documents', 'lead-based-paint'],
} as const;
