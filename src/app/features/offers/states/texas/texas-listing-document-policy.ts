import type { OfferListingDocumentPolicy } from '../../engine/listing-document-policy.registry';

/** Texas owns its lease document types and their stored answer paths. */
export function texasListingDocumentPolicy(documentType: string): OfferListingDocumentPolicy | undefined {
  const rules: Readonly<Record<string, string>> = {
    'texas-residential-leases': 'leases.residentialLeasesExist',
    'texas-fixture-leases': 'leases.fixtureLeasesExist',
    'texas-natural-resource-leases': 'leases.naturalResourceLeasesExist',
  };
  const requiredFieldPath = rules[documentType];
  if (requiredFieldPath) return { sectionId: 'leases', requiredFieldPath };
  if (documentType.startsWith('texas-') && documentType.endsWith('-leases')) return { sectionId: 'hidden' };
  return undefined;
}
