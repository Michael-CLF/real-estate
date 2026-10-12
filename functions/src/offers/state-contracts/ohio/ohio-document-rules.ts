/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const OHIO_DOCUMENT_RULES = {
  templateUid: 'navstreet-oh-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['ohio-statutory-packet', 'ohio-seller-disclosure', 'ohio-association-documents', 'lead-based-paint'],
} as const;
