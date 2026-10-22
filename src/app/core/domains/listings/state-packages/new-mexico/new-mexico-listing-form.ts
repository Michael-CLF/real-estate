import type { FormBuilder } from '@angular/forms';
export interface NewMexicoListingAnswers {
 readonly taxEstimateUnavailable: boolean | null;
 readonly privateWastewaterApplies: boolean | null;
 readonly drugLabContaminationKnown: boolean | null;
 readonly appurtenantWaterRightsKnown: boolean | null;
}
export function createNewMexicoListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({taxEstimateUnavailable: [null as boolean | null],privateWastewaterApplies: [null as boolean | null],drugLabContaminationKnown: [null as boolean | null],appurtenantWaterRightsKnown: [null as boolean | null]}); }
export function restoreNewMexicoListingAnswers(saved: Partial<NewMexicoListingAnswers> | null | undefined): NewMexicoListingAnswers { return {taxEstimateUnavailable: saved?.taxEstimateUnavailable ?? null,privateWastewaterApplies: saved?.privateWastewaterApplies ?? null,drugLabContaminationKnown: saved?.drugLabContaminationKnown ?? null,appurtenantWaterRightsKnown: saved?.appurtenantWaterRightsKnown ?? null}; }
