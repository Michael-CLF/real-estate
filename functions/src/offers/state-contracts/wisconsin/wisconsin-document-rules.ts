/** NavStreet-authored contract. Seller statements and conditional packets remain separate attachments. */
export const WISCONSIN_DOCUMENT_RULES = {
  templateUid: 'navstreet-wi-residential-2026',
  version: '2026-09-25',
  requiredListingStatements: ['leasesExist'],
  optionalListingDisclosures: [],
  conditionalListingDisclosures: ['wisconsin-real-estate-condition-report', 'lead-based-paint', 'wisconsin-association-documents', 'wisconsin-lease-documents'],
} as const;
