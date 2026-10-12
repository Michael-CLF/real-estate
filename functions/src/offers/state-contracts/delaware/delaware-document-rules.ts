/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const DELAWARE_DOCUMENT_RULES = {
  templateUid: 'navstreet-de-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['delaware-statutory-packet', 'delaware-seller-disclosure', 'delaware-association-documents', 'lead-based-paint'],
} as const;
