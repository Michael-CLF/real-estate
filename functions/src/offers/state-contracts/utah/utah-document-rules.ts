/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const UTAH_DOCUMENT_RULES = {
  templateUid: 'navstreet-ut-residential-2026',
  version: '2026-09-25',
  requiredListingStatements: ['methamphetamineContaminationKnown'],
  optionalListingDisclosures: ['utah-seller-property-condition'],
  conditionalListingDisclosures: ['lead-based-paint', 'utah-hoa-governing-documents', 'utah-methamphetamine-contamination'],
} as const;
