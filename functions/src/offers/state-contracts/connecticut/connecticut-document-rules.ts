/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const CONNECTICUT_DOCUMENT_RULES = {
  templateUid: 'navstreet-ct-residential-2026',
  version: '2026-10-25',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['connecticut-statutory-packet', 'connecticut-seller-disclosure', 'connecticut-association-documents', 'lead-based-paint'],
} as const;
