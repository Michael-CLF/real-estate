import type { FormBuilder } from '@angular/forms';
export interface AlabamaListingAnswers {
 readonly usesEasternTime: boolean | null;
 readonly hiddenHealthSafetyKnown: boolean | null;
}
export function createAlabamaListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({usesEasternTime: [null as boolean | null],hiddenHealthSafetyKnown: [null as boolean | null]}); }
export function restoreAlabamaListingAnswers(saved: Partial<AlabamaListingAnswers> | null | undefined): AlabamaListingAnswers { return {usesEasternTime: saved?.usesEasternTime ?? null,hiddenHealthSafetyKnown: saved?.hiddenHealthSafetyKnown ?? null}; }
