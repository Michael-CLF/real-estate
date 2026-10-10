/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const MICHIGAN_DOCUMENT_RULES = {
  templateUid: 'navstreet-mi-residential-2026',
  version: '2026-10-09',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['michigan-statutory-packet', 'michigan-seller-disclosure', 'michigan-association-documents', 'lead-based-paint'],
} as const;
