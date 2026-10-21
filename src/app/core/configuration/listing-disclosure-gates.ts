import { isFederalLeadExcluded } from '../domains/offers/federal-lead-policy';
import type { DisclosureDocumentType } from '../domains/disclosures/models/state-disclosure-requirement.model';

/** Existing upload-gate facts. State codes are normalized by the callers. */
export interface ListingDisclosureGateFacts {
 readonly contractFacts?: {readonly isCondominium?:boolean|null};
 readonly wyoming?: { readonly privateWastewaterApplies?: boolean | null; readonly appurtenantWaterRightsKnown?: boolean | null; };
 readonly southDakota?: { readonly usesMountainTime?: boolean | null; readonly disclosureExemptionClaimed?: boolean | null; readonly privateTransferFeeKnown?: boolean | null; };
 readonly newMexico?: { readonly privateWastewaterApplies?: boolean | null; readonly drugLabContaminationKnown?: boolean | null; readonly appurtenantWaterRightsKnown?: boolean | null; };
 readonly maryland?: { readonly disclosureExemptionClaimed?: boolean | null; readonly usesDisclaimer?: boolean | null; readonly privateWellApplies?: boolean | null; readonly onsiteSewageApplies?: boolean | null; readonly deferredWaterSewerCharges?: boolean | null; readonly superfundNearby?: boolean | null; readonly otherPropertyNoticeApplies?: boolean | null; readonly rentalLeadObligationApplies?: boolean | null; readonly groundRentApplies?: boolean | null; };
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

/** Federal cutoff overrides stale flags; preserve existing older-housing upload policies. */
export function isListingLeadUploadRequired(code: string, facts: ListingDisclosureGateFacts): boolean {
  if (isFederalLeadExcluded(facts)) return false;
  if (code === 'MO' && facts.propertyType === 'land') return false;
  if (code === 'CO' || code === 'LA' || code === 'MN' || code === 'MI' || code === 'AZ' || code === 'ID' || code === 'OR' || code === 'MO' || code === 'NE' || code === 'NH' || code === 'AL' || code === 'IN' || code === 'KS' || code === 'OH' || code === 'DE' || code === 'WA' || code === 'IA' || code === 'MT' || code === 'MD' || code === 'NM' || code === 'SD' || code === 'WY')
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
    ...((facts.ownersAssociationApplies === true || facts.contractFacts?.isCondominium === true || facts.propertyType === 'condo') ? ['arizona-association-documents' as const] : []),
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'AZ') return ['arizona-seller-disclosure', 'arizona-statutory-packet',
    ...((facts.ownersAssociationApplies === true || facts.contractFacts?.isCondominium === true || facts.propertyType === 'condo') ? ['arizona-association-documents' as const] : []),
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'AL') return [...(facts.alabama?.hiddenHealthSafetyKnown !== false ? ['alabama-statutory-packet' as const] : []), ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'IN') return ['indiana-seller-disclosure', ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'KS') return [...(facts.kansas?.elevatedRadonKnown !== false ? ['kansas-statutory-packet' as const] : []), ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'OH') return [...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'DE') return ['delaware-seller-disclosure',...(facts.delaware?.disclosureExemptionClaimed !== true ? ['delaware-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'WA') return [...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'IA') return [...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'MT') return ['montana-seller-disclosure',...(facts.montana?.radonTestsKnown !== false || facts.montana?.drugContaminationKnown !== false || facts.montana?.appurtenantWaterRightsKnown !== false ? ['montana-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'MD') return [...(['deferredWaterSewerCharges','superfundNearby','otherPropertyNoticeApplies','rentalLeadObligationApplies'].some(key => facts.maryland?.[key as keyof NonNullable<ListingDisclosureGateFacts['maryland']>] !== false) ? ['maryland-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'NM') return [...(facts.newMexico?.drugLabContaminationKnown !== false ? ['new-mexico-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'SD') return ['south-dakota-seller-disclosure',...(facts.southDakota?.disclosureExemptionClaimed === true && facts.southDakota?.privateTransferFeeKnown !== false ? ['south-dakota-statutory-packet' as const] : []),...(facts.ownersAssociationApplies === true ? ['south-dakota-association-documents' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'WY') return [...(false ? ['wyoming-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'OR') return [...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'MO') return [...(facts.missouri?.methProductionKnown !== false || facts.missouri?.drugConvictionKnown !== false ? ['missouri-statutory-packet' as const] : []), ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'NE') return ['nebraska-seller-disclosure', ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'NH') return ['new-hampshire-seller-disclosure','new-hampshire-statutory-packet', ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'ID') return ['idaho-statutory-packet',
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'MN') return ['minnesota-seller-disclosure', 'minnesota-statutory-packet',
    ...((facts.ownersAssociationApplies === true || facts.contractFacts?.isCondominium === true || facts.propertyType === 'condo') ? ['minnesota-association-documents' as const] : []),
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
