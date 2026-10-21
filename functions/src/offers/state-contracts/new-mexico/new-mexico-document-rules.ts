/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const NEW_MEXICO_DOCUMENT_RULES = {
  templateUid: 'navstreet-nm-residential-2026',
  version: '2026-10-10',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['new-mexico-statutory-packet', 'new-mexico-seller-disclosure', 'new-mexico-association-documents', 'lead-based-paint'],
} as const;
