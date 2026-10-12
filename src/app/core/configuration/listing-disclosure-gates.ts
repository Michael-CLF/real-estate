import type { DisclosureDocumentType } from '../domains/disclosures/models/state-disclosure-requirement.model';

/** Existing upload-gate facts. State codes are normalized by the callers. */
export interface ListingDisclosureGateFacts {
 readonly montana?: { readonly disclosureExemptionClaimed?: boolean | null; readonly radonTestsKnown?: boolean | null; readonly drugContaminationKnown?: boolean | null; readonly appurtenantWaterRightsKnown?: boolean | null; };
 readonly iowa?: { readonly disclosureExemptionClaimed?: boolean | null; readonly privateSewageApplies?: boolean | null; readonly leadServiceLineKnown?: boolean | null; };
 readonly washington?: { readonly disclosureExemptionClaimed?: boolean | null; readonly oilTankHeating?: boolean | null; };
 readonly delaware?: { readonly disclosureExemptionClaimed?: boolean | null; readonly radonReportsKnown?: boolean | null; };
 readonly ohio?: { readonly disclosureExemptionClaimed?: boolean | null; };
 readonly kansas?: { readonly usesMountainTime?: boolean | null; readonly elevatedRadonKnown?: boolean | null; };
 readonly indiana?: { readonly usesCentralTime?: boolean | null; readonly disclosureExemptionClaimed?: boolean | null; };
 readonly alabama?: { readonly usesEasternTime?: boolean | null; readonly hiddenHealthSafetyKnown?: boolean | null; };
 readonly missouri?: { readonly methProductionKnown?: boolean | null; readonly drugConvictionKnown?: boolean | null };
  readonly yearBuilt?: number | null;
  readonly propertyType?: string | null;
  readonly leadBasedPaintApplies?: boolean | null;
  readonly ownersAssociationApplies?: boolean | null;
}

/** Preserve each state's existing lead-applicability decision, including unknown-year behavior. */
export function isListingLeadUploadRequired(code: string, facts: ListingDisclosureGateFacts): boolean {
  if (code === 'CO' || code === 'LA' || code === 'MN' || code === 'MI' || code === 'AZ' || code === 'ID' || code === 'OR' || code === 'MO' || code === 'NE' || code === 'NH' || code === 'AL' || code === 'IN' || code === 'KS' || code === 'OH' || code === 'DE' || code === 'WA' || code === 'IA' || code === 'MT')
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
  if (code === 'AL') return [...(facts.alabama?.hiddenHealthSafetyKnown !== false ? ['alabama-statutory-packet' as const] : []), ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'IN') return [...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'KS') return [...(facts.kansas?.elevatedRadonKnown !== false ? ['kansas-statutory-packet' as const] : []), ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'OH') return [...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'DE') return ['delaware-seller-disclosure',...(facts.delaware?.disclosureExemptionClaimed !== true ? ['delaware-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'WA') return [...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'IA') return ['iowa-seller-disclosure',...(facts.iowa?.disclosureExemptionClaimed !== true ? ['iowa-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'MT') return ['montana-seller-disclosure',...(facts.montana?.radonTestsKnown !== false || facts.montana?.drugContaminationKnown !== false || facts.montana?.appurtenantWaterRightsKnown !== false ? ['montana-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'OR') return [...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'MO') return [...(facts.missouri?.methProductionKnown !== false || facts.missouri?.drugConvictionKnown !== false ? ['missouri-statutory-packet' as const] : []), ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'NE') return ['nebraska-seller-disclosure', ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'NH') return ['new-hampshire-seller-disclosure','new-hampshire-statutory-packet', ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
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
