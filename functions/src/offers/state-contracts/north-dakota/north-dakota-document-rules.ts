/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const NORTH_DAKOTA_DOCUMENT_RULES = {
  templateUid: 'navstreet-nd-residential-2026',
  version: '2026-10-24',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['north-dakota-statutory-packet', 'north-dakota-seller-disclosure', 'north-dakota-association-documents', 'lead-based-paint'],
} as const;
