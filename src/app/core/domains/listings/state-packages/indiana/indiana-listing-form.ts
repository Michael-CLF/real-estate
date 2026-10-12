import type { FormBuilder } from '@angular/forms';
export interface IndianaListingAnswers {
 readonly usesCentralTime: boolean | null;
 readonly disclosureExemptionClaimed: boolean | null;
}
export function createIndianaListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({usesCentralTime: [null as boolean | null],disclosureExemptionClaimed: [null as boolean | null]}); }
export function restoreIndianaListingAnswers(saved: Partial<IndianaListingAnswers> | null | undefined): IndianaListingAnswers { return {usesCentralTime: saved?.usesCentralTime ?? null,disclosureExemptionClaimed: saved?.disclosureExemptionClaimed ?? null}; }
