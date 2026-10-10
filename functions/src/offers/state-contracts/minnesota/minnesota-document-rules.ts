/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const MINNESOTA_DOCUMENT_RULES = {
  templateUid: 'navstreet-mn-residential-2026',
  version: '2026-10-09',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['minnesota-statutory-packet', 'minnesota-seller-disclosure', 'minnesota-association-documents', 'lead-based-paint'],
} as const;
