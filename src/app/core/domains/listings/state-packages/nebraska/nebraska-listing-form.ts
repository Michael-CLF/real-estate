import type { FormBuilder } from '@angular/forms';
export interface NebraskaListingAnswers {
 readonly usesMountainTime: boolean | null;
}
export function createNebraskaListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({usesMountainTime: [null as boolean | null]}); }
export function restoreNebraskaListingAnswers(saved: Partial<NebraskaListingAnswers> | null | undefined): NebraskaListingAnswers { return {usesMountainTime: saved?.usesMountainTime ?? null}; }
