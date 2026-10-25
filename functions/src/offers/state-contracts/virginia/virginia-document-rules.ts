/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const VIRGINIA_DOCUMENT_RULES = {
  templateUid: 'navstreet-va-residential-2026',
  version: '2026-10-25',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['virginia-statutory-packet', 'virginia-seller-disclosure', 'virginia-association-documents', 'lead-based-paint'],
} as const;
