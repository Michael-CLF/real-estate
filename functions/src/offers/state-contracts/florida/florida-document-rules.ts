/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const FLORIDA_DOCUMENT_RULES = {
  templateUid: 'navstreet-fl-residential-2026',
  version: '2026-09-26',
  requiredListingStatements: ['leasesExist', 'ownersAssociationApplies'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['florida-flood-disclosure', 'florida-seller-property-disclosure', 'florida-hoa-disclosure-summary', 'lead-based-paint'],
} as const;
