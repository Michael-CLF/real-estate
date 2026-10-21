/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const SOUTH_DAKOTA_DOCUMENT_RULES = {
  templateUid: 'navstreet-sd-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['south-dakota-statutory-packet', 'south-dakota-seller-disclosure', 'south-dakota-association-documents', 'lead-based-paint'],
} as const;
