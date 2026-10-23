/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const MAINE_DOCUMENT_RULES = {
  templateUid: 'navstreet-me-residential-2026',
  version: '2026-10-23',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['maine-statutory-packet', 'maine-seller-disclosure', 'maine-association-documents', 'lead-based-paint'],
} as const;
