/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const MARYLAND_DOCUMENT_RULES = {
  templateUid: 'navstreet-md-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['maryland-statutory-packet', 'maryland-seller-disclosure', 'maryland-association-documents', 'lead-based-paint'],
} as const;
