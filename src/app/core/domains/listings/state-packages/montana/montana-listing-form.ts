import type { FormBuilder } from '@angular/forms';
export interface MontanaListingAnswers {
 readonly disclosureExemptionClaimed: boolean | null;
 readonly radonTestsKnown: boolean | null;
 readonly drugContaminationKnown: boolean | null;
 readonly appurtenantWaterRightsKnown: boolean | null;
}
export function createMontanaListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({disclosureExemptionClaimed: [null as boolean | null],radonTestsKnown: [null as boolean | null],drugContaminationKnown: [null as boolean | null],appurtenantWaterRightsKnown: [null as boolean | null]}); }
export function restoreMontanaListingAnswers(saved: Partial<MontanaListingAnswers> | null | undefined): MontanaListingAnswers { return {disclosureExemptionClaimed: saved?.disclosureExemptionClaimed ?? null,radonTestsKnown: saved?.radonTestsKnown ?? null,drugContaminationKnown: saved?.drugContaminationKnown ?? null,appurtenantWaterRightsKnown: saved?.appurtenantWaterRightsKnown ?? null}; }
