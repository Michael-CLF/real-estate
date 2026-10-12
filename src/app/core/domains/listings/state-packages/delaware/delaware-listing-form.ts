import type { FormBuilder } from '@angular/forms';
export interface DelawareListingAnswers {
 readonly disclosureExemptionClaimed: boolean | null;
 readonly radonReportsKnown: boolean | null;
}
export function createDelawareListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({disclosureExemptionClaimed: [null as boolean | null],radonReportsKnown: [null as boolean | null]}); }
export function restoreDelawareListingAnswers(saved: Partial<DelawareListingAnswers> | null | undefined): DelawareListingAnswers { return {disclosureExemptionClaimed: saved?.disclosureExemptionClaimed ?? null,radonReportsKnown: saved?.radonReportsKnown ?? null}; }
