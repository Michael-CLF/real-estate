import type { FormBuilder } from '@angular/forms';
export interface SouthDakotaListingAnswers {
 readonly condominiumReportIssued: boolean | null;
 readonly usesMountainTime: boolean | null;
 readonly disclosureExemptionClaimed: boolean | null;
 readonly privateTransferFeeKnown: boolean | null;
}
export function createSouthDakotaListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({condominiumReportIssued: [null as boolean | null],usesMountainTime: [null as boolean | null],disclosureExemptionClaimed: [null as boolean | null],privateTransferFeeKnown: [null as boolean | null]}); }
export function restoreSouthDakotaListingAnswers(saved: Partial<SouthDakotaListingAnswers> | null | undefined): SouthDakotaListingAnswers { return {condominiumReportIssued: saved?.condominiumReportIssued ?? null,usesMountainTime: saved?.usesMountainTime ?? null,disclosureExemptionClaimed: saved?.disclosureExemptionClaimed ?? null,privateTransferFeeKnown: saved?.privateTransferFeeKnown ?? null}; }
