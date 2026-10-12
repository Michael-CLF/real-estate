import type { FormBuilder } from '@angular/forms';
export interface WashingtonListingAnswers {
 readonly disclosureExemptionClaimed: boolean | null;
 readonly oilTankHeating: boolean | null;
}
export function createWashingtonListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({disclosureExemptionClaimed: [null as boolean | null],oilTankHeating: [null as boolean | null]}); }
export function restoreWashingtonListingAnswers(saved: Partial<WashingtonListingAnswers> | null | undefined): WashingtonListingAnswers { return {disclosureExemptionClaimed: saved?.disclosureExemptionClaimed ?? null,oilTankHeating: saved?.oilTankHeating ?? null}; }
