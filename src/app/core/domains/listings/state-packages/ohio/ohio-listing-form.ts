import type { FormBuilder } from '@angular/forms';
export interface OhioListingAnswers {
 readonly disclosureExemptionClaimed: boolean | null;
}
export function createOhioListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({disclosureExemptionClaimed: [null as boolean | null]}); }
export function restoreOhioListingAnswers(saved: Partial<OhioListingAnswers> | null | undefined): OhioListingAnswers { return {disclosureExemptionClaimed: saved?.disclosureExemptionClaimed ?? null}; }
