/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const NEVADA_DOCUMENT_RULES = {
  templateUid: 'navstreet-nv-residential-2026',
  version: '2026-10-24',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['nevada-statutory-packet', 'nevada-seller-disclosure', 'nevada-association-documents', 'lead-based-paint'],
} as const;
