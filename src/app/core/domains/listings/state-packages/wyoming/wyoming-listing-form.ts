import type { FormBuilder } from '@angular/forms';
export interface WyomingListingAnswers {
 readonly privateWastewaterApplies: boolean | null;
 readonly appurtenantWaterRightsKnown: boolean | null;
}
export function createWyomingListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({privateWastewaterApplies: [null as boolean | null],appurtenantWaterRightsKnown: [null as boolean | null]}); }
export function restoreWyomingListingAnswers(saved: Partial<WyomingListingAnswers> | null | undefined): WyomingListingAnswers { return {privateWastewaterApplies: saved?.privateWastewaterApplies ?? null,appurtenantWaterRightsKnown: saved?.appurtenantWaterRightsKnown ?? null}; }
