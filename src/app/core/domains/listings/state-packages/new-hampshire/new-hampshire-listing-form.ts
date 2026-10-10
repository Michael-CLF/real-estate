import type { FormBuilder } from '@angular/forms';
export interface NewHampshireListingAnswers {
 readonly methProductionKnown: boolean | null;
 readonly utilityTariffChargesKnown: boolean | null;
}
export function createNewHampshireListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({methProductionKnown: [null as boolean | null],utilityTariffChargesKnown: [null as boolean | null]}); }
export function restoreNewHampshireListingAnswers(saved: Partial<NewHampshireListingAnswers> | null | undefined): NewHampshireListingAnswers { return {methProductionKnown: saved?.methProductionKnown ?? null,utilityTariffChargesKnown: saved?.utilityTariffChargesKnown ?? null}; }
