import type { FormBuilder } from '@angular/forms';
export interface MarylandListingAnswers {
 readonly disclosureExemptionClaimed: boolean | null;
 readonly usesDisclaimer: boolean | null;
 readonly privateWellApplies: boolean | null;
 readonly onsiteSewageApplies: boolean | null;
 readonly deferredWaterSewerCharges: boolean | null;
 readonly superfundNearby: boolean | null;
 readonly otherPropertyNoticeApplies: boolean | null;
 readonly rentalLeadObligationApplies: boolean | null;
 readonly groundRentApplies: boolean | null;
}
export function createMarylandListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({disclosureExemptionClaimed: [null as boolean | null],usesDisclaimer: [null as boolean | null],privateWellApplies: [null as boolean | null],onsiteSewageApplies: [null as boolean | null],deferredWaterSewerCharges: [null as boolean | null],superfundNearby: [null as boolean | null],otherPropertyNoticeApplies: [null as boolean | null],rentalLeadObligationApplies: [null as boolean | null],groundRentApplies: [null as boolean | null]}); }
export function restoreMarylandListingAnswers(saved: Partial<MarylandListingAnswers> | null | undefined): MarylandListingAnswers { return {disclosureExemptionClaimed: saved?.disclosureExemptionClaimed ?? null,usesDisclaimer: saved?.usesDisclaimer ?? null,privateWellApplies: saved?.privateWellApplies ?? null,onsiteSewageApplies: saved?.onsiteSewageApplies ?? null,deferredWaterSewerCharges: saved?.deferredWaterSewerCharges ?? null,superfundNearby: saved?.superfundNearby ?? null,otherPropertyNoticeApplies: saved?.otherPropertyNoticeApplies ?? null,rentalLeadObligationApplies: saved?.rentalLeadObligationApplies ?? null,groundRentApplies: saved?.groundRentApplies ?? null}; }
