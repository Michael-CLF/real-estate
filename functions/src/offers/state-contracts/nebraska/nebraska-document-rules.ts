/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const NEBRASKA_DOCUMENT_RULES = {
  templateUid: 'navstreet-ne-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['nebraska-statutory-packet', 'nebraska-seller-disclosure', 'nebraska-association-documents', 'lead-based-paint'],
} as const;
