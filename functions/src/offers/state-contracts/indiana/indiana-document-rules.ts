/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const INDIANA_DOCUMENT_RULES = {
  templateUid: 'navstreet-in-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['indiana-statutory-packet', 'indiana-seller-disclosure', 'indiana-association-documents', 'lead-based-paint'],
} as const;
