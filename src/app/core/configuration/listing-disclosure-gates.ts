import type { DisclosureDocumentType } from '../domains/disclosures/models/state-disclosure-requirement.model';

/** Existing upload-gate facts. State codes are normalized by the callers. */
export interface ListingDisclosureGateFacts {
  readonly yearBuilt?: number | null;
  readonly propertyType?: string | null;
  readonly leadBasedPaintApplies?: boolean | null;
  readonly ownersAssociationApplies?: boolean | null;
}

/** Preserve each state's existing lead-applicability decision, including unknown-year behavior. */
export function isListingLeadUploadRequired(code: string, facts: ListingDisclosureGateFacts): boolean {
  if (code === 'CO' || code === 'LA' || code === 'MN' || code === 'MI' || code === 'AZ' || code === 'ID')
    return facts.leadBasedPaintApplies === true || facts.yearBuilt == null || facts.yearBuilt < 1978;
  if (code === 'FL')
    return facts.leadBasedPaintApplies === true ||
      (typeof facts.yearBuilt === 'number' && facts.yearBuilt < 1978 && facts.leadBasedPaintApplies !== false);
  return false;
}

export function getListingUploadGateDocumentTypes(
  code: string, facts: ListingDisclosureGateFacts, now: number,
): readonly DisclosureDocumentType[] {
  if (code === 'AZ') return ['arizona-seller-disclosure', 'arizona-statutory-packet',
    ...(facts.ownersAssociationApplies === true ? ['arizona-association-documents' as const] : []),
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'AZ') return ['arizona-seller-disclosure', 'arizona-statutory-packet',
    ...(facts.ownersAssociationApplies === true ? ['arizona-association-documents' as const] : []),
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'ID') return ['idaho-statutory-packet',
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'MN') return ['minnesota-seller-disclosure', 'minnesota-statutory-packet',
    ...(facts.ownersAssociationApplies === true ? ['minnesota-association-documents' as const] : []),
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'MI' || code === 'AZ' || code === 'ID') return ['michigan-seller-disclosure', 'michigan-statutory-packet',
    ...(facts.ownersAssociationApplies === true ? ['michigan-association-documents' as const] : []),
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'FL') return [
    'florida-flood-disclosure',
    ...(facts.ownersAssociationApplies === true ? ['florida-hoa-disclosure-summary' as const] : []),
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : []),
  ];
  if (code === 'LA') {
    if (facts.propertyType === 'land') return now >= Date.parse('2027-01-01T06:00:00Z')
      ? ['louisiana-vacant-residential-property-disclosure'] : [];
    return ['louisiana-property-disclosure', ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  }
  if (code === 'CO') return ['colorado-property-disclosure', 'colorado-radon-brochure',
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  return [];
}
