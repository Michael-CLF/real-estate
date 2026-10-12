/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const MONTANA_DOCUMENT_RULES = {
  templateUid: 'navstreet-mt-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['montana-statutory-packet', 'montana-seller-disclosure', 'montana-association-documents', 'lead-based-paint'],
} as const;
