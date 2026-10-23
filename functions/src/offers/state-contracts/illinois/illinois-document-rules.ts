/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const ILLINOIS_DOCUMENT_RULES = {
  templateUid: 'navstreet-il-residential-2026',
  version: '2026-10-23',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['illinois-statutory-packet', 'illinois-seller-disclosure', 'illinois-association-documents', 'lead-based-paint'],
} as const;
