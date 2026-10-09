import type { ListingDisclosureDocument } from '../../../core/domains/disclosures/models/listing-disclosure-document.model';
import { texasListingDocumentPolicy } from '../states/texas/texas-listing-document-policy';

export interface OfferListingDocumentPolicy {
  readonly sectionId: string;
  readonly requiredFieldPath?: string;
}

const POLICIES = [texasListingDocumentPolicy];

/** State-owned document rules feed one state-neutral selection path. */
export function selectOfferListingDocuments(
  sectionId: string, terms: unknown, documents: readonly ListingDisclosureDocument[],
): readonly ListingDisclosureDocument[] {
  return documents.filter(document => {
    const rules = POLICIES.map(policy => policy(document.documentType)).filter(Boolean);
    if (rules.length > 1) throw new Error(`More than one listing document policy owns ${document.documentType}.`);
    const rule = rules[0] ?? { sectionId: 'disclosures' };
    if (rule.sectionId !== sectionId) return false;
    if (!rule.requiredFieldPath) return true;
    let value: unknown = terms;
    for (const key of rule.requiredFieldPath.split('.')) {
      value = value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined;
    }
    return value === true;
  });
}
