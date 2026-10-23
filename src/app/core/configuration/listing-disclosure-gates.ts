import { isFederalLeadExcluded } from '../domains/offers/federal-lead-policy';
import type { DisclosureDocumentType } from '../domains/disclosures/models/state-disclosure-requirement.model';

/** Existing upload-gate facts. State codes are normalized by the callers. */
export interface ListingDisclosureGateFacts {
 readonly uploadedDocumentTypes?: readonly string[];
 readonly southCarolina?: { readonly beachfrontApplies?: boolean | null; readonly futureVacationBookingsExist?: boolean | null; };
 readonly methamphetamineContaminationKnown?: boolean | null;
 readonly contractFacts?: {readonly isCondominium?:boolean|null};
 readonly wyoming?: { readonly privateWastewaterApplies?: boolean | null; readonly appurtenantWaterRightsKnown?: boolean | null; };
 readonly maine?: { disclosureExemptionClaimed?: boolean | null; };
 readonly mississippi?: {};
 readonly arkansas?: { };
 readonly illinois?: { disclosureExemptionClaimed?: boolean | null; radonExemptionClaimed?: boolean | null; };
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
  return !isFederalLeadExcluded(facts);
}

export function getListingUploadGateDocumentTypes(
  code: string, facts: ListingDisclosureGateFacts, now: number,
): readonly DisclosureDocumentType[] {
  if (code === 'NC') return [...(['residential-property-owners-association', 'mineral-oil-gas-rights'] as DisclosureDocumentType[]), ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'TX') return [...(['texas-seller-disclosure-notice'] as DisclosureDocumentType[]), ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'UT') return [...((facts.methamphetamineContaminationKnown === true ? ['utah-methamphetamine-contamination'] : []) as DisclosureDocumentType[]), ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'WI') return [...([] as DisclosureDocumentType[]), ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'SC') return [...(['south-carolina-property-condition', ...(facts.southCarolina?.beachfrontApplies === true ? ['south-carolina-coastal-disclosure'] : []), ...(facts.southCarolina?.futureVacationBookingsExist === true ? ['south-carolina-vacation-rentals'] : [])] as DisclosureDocumentType[]), ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'OK') {
    const alternatives = ['oklahoma-property-condition-disclosure', 'oklahoma-property-condition-disclaimer', 'oklahoma-property-condition-exemption'] as const;
    return [alternatives.find(type => facts.uploadedDocumentTypes?.includes(type)) ?? alternatives[0], ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  }
  if (['ME','MS','AR','IL'].includes(code)) {
    const condition = code==='ME' ? facts.maine?.disclosureExemptionClaimed !== true : code==='IL' ? facts.illinois?.disclosureExemptionClaimed !== true : false;
    const slug=({ME:'maine',MS:'mississippi',AR:'arkansas',IL:'illinois'} as Record<string,string>)[code];
    return [...(condition ? [slug+'-seller-disclosure' as DisclosureDocumentType] : []),...(code==='IL' && facts.illinois?.radonExemptionClaimed!==true ? ['illinois-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  }
  if (code === 'AZ') return ['arizona-seller-disclosure', 'arizona-statutory-packet',
    ...((facts.ownersAssociationApplies === true || facts.contractFacts?.isCondominium === true || facts.propertyType === 'condo') ? ['arizona-association-documents' as const] : []),
    ...(isListingLeadUploadRequired(code, facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'AL') return [...(facts.alabama?.hiddenHealthSafetyKnown !== false ? ['alabama-statutory-packet' as const] : []), ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'IN') return ['indiana-seller-disclosure', ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'KS') return [...(facts.kansas?.elevatedRadonKnown !== false ? ['kansas-statutory-packet' as const] : []), ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'OH') return ['ohio-seller-disclosure', ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'DE') return ['delaware-seller-disclosure',...(facts.delaware?.disclosureExemptionClaimed !== true ? ['delaware-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'WA') return [...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'IA') return ['iowa-seller-disclosure', ...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'MT') return ['montana-seller-disclosure', ...((facts.contractFacts?.isCondominium === true || facts.propertyType === 'condo') ? ['montana-association-documents' as const] : []),...(facts.montana?.radonTestsKnown !== false || facts.montana?.drugContaminationKnown !== false || facts.montana?.appurtenantWaterRightsKnown !== false ? ['montana-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'MD') return ['maryland-seller-disclosure',...(['deferredWaterSewerCharges','superfundNearby','otherPropertyNoticeApplies','rentalLeadObligationApplies'].some(key => facts.maryland?.[key as keyof NonNullable<ListingDisclosureGateFacts['maryland']>] !== false) ? ['maryland-statutory-packet' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'NM') return ['new-mexico-statutory-packet',...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
  if (code === 'SD') return ['south-dakota-seller-disclosure',...(facts.southDakota?.disclosureExemptionClaimed === true && facts.southDakota?.privateTransferFeeKnown !== false ? ['south-dakota-statutory-packet' as const] : []),...((facts.ownersAssociationApplies === true || facts.contractFacts?.isCondominium === true || facts.propertyType === 'condo') ? ['south-dakota-association-documents' as const] : []),...(isListingLeadUploadRequired(code,facts) ? ['lead-based-paint' as const] : [])];
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
