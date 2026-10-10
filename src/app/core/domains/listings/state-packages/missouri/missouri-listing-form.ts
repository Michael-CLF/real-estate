import type { FormBuilder } from '@angular/forms';
export interface MissouriListingAnswers {
 readonly methProductionKnown: boolean | null;
 readonly drugConvictionKnown: boolean | null;
}
export function createMissouriListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({methProductionKnown: [null as boolean | null],drugConvictionKnown: [null as boolean | null]}); }
export function restoreMissouriListingAnswers(saved: Partial<MissouriListingAnswers> | null | undefined): MissouriListingAnswers { return {methProductionKnown: saved?.methProductionKnown ?? null,drugConvictionKnown: saved?.drugConvictionKnown ?? null}; }
