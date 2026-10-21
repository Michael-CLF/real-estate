import type { FormBuilder } from '@angular/forms';
export interface SouthDakotaListingAnswers {
 readonly usesMountainTime: boolean | null;
 readonly disclosureExemptionClaimed: boolean | null;
 readonly privateTransferFeeKnown: boolean | null;
}
export function createSouthDakotaListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({usesMountainTime: [null as boolean | null],disclosureExemptionClaimed: [null as boolean | null],privateTransferFeeKnown: [null as boolean | null]}); }
export function restoreSouthDakotaListingAnswers(saved: Partial<SouthDakotaListingAnswers> | null | undefined): SouthDakotaListingAnswers { return {usesMountainTime: saved?.usesMountainTime ?? null,disclosureExemptionClaimed: saved?.disclosureExemptionClaimed ?? null,privateTransferFeeKnown: saved?.privateTransferFeeKnown ?? null}; }
