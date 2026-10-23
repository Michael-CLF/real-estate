/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const MISSISSIPPI_DOCUMENT_RULES = {
  templateUid: 'navstreet-ms-residential-2026',
  version: '2026-10-23',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['mississippi-statutory-packet', 'mississippi-seller-disclosure', 'mississippi-association-documents', 'lead-based-paint'],
} as const;
