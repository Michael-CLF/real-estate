/** Packages own document mappings; this helper preserves exact received-status selection and order. */
export function selectReceivedListingDisclosures<TDisclosures extends object>(
  disclosures: TDisclosures,
  mappings: readonly (readonly [keyof TDisclosures, string])[],
): string[] {
  return mappings
    .filter(([field]) => disclosures[field] === 'received')
    .map(([, documentType]) => documentType);
}
