/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const ALABAMA_DOCUMENT_RULES = {
  templateUid: 'navstreet-al-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['alabama-statutory-packet', 'alabama-seller-disclosure', 'alabama-association-documents', 'lead-based-paint'],
} as const;
