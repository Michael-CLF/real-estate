import type { FormBuilder } from '@angular/forms';
export interface IowaListingAnswers {
 readonly disclosureExemptionClaimed: boolean | null;
 readonly privateSewageApplies: boolean | null;
 readonly leadServiceLineKnown: boolean | null;
}
export function createIowaListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({disclosureExemptionClaimed: [null as boolean | null],privateSewageApplies: [null as boolean | null],leadServiceLineKnown: [null as boolean | null]}); }
export function restoreIowaListingAnswers(saved: Partial<IowaListingAnswers> | null | undefined): IowaListingAnswers { return {disclosureExemptionClaimed: saved?.disclosureExemptionClaimed ?? null,privateSewageApplies: saved?.privateSewageApplies ?? null,leadServiceLineKnown: saved?.leadServiceLineKnown ?? null}; }
