/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const MISSOURI_DOCUMENT_RULES = {
  templateUid: 'navstreet-mo-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['missouri-statutory-packet', 'missouri-seller-disclosure', 'missouri-association-documents', 'missouri-condominium-resale-certificate', 'missouri-tenant-records', 'lead-based-paint'],
} as const;
