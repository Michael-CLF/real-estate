/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const VERMONT_DOCUMENT_RULES = {
  templateUid: 'navstreet-vt-residential-2026',
  version: '2026-10-25',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['vermont-statutory-packet', 'vermont-seller-disclosure', 'vermont-association-documents', 'lead-based-paint'],
} as const;
