/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const IDAHO_DOCUMENT_RULES = {
  templateUid: 'navstreet-id-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['idaho-statutory-packet', 'idaho-seller-disclosure', 'idaho-association-documents', 'lead-based-paint'],
} as const;
