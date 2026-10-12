/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const IOWA_DOCUMENT_RULES = {
  templateUid: 'navstreet-ia-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['iowa-statutory-packet', 'iowa-seller-disclosure', 'iowa-association-documents', 'lead-based-paint'],
} as const;
