import type { FormBuilder } from '@angular/forms';
export interface OregonListingAnswers {
 readonly historicSpecialAssessmentApplies: boolean | null;
 readonly usesMountainTime: boolean | null;
 readonly domesticWellApplies: boolean | null;
 readonly uncertifiedWoodDevicePresent: boolean | null;
}
export function createOregonListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({historicSpecialAssessmentApplies: [null as boolean | null],usesMountainTime: [null as boolean | null],domesticWellApplies: [null as boolean | null],uncertifiedWoodDevicePresent: [null as boolean | null]}); }
export function restoreOregonListingAnswers(saved: Partial<OregonListingAnswers> | null | undefined): OregonListingAnswers { return {historicSpecialAssessmentApplies: saved?.historicSpecialAssessmentApplies ?? null,usesMountainTime: saved?.usesMountainTime ?? null,domesticWellApplies: saved?.domesticWellApplies ?? null,uncertifiedWoodDevicePresent: saved?.uncertifiedWoodDevicePresent ?? null}; }
