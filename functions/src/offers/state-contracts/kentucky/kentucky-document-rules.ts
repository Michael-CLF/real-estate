/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const KENTUCKY_DOCUMENT_RULES = {
  templateUid: 'navstreet-ky-residential-2026',
  version: '2026-10-24',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['kentucky-statutory-packet', 'kentucky-seller-disclosure', 'kentucky-association-documents', 'lead-based-paint'],
} as const;
