import type { FormBuilder } from '@angular/forms';
export interface KansasListingAnswers {
 readonly usesMountainTime: boolean | null;
 readonly elevatedRadonKnown: boolean | null;
}
export function createKansasListingAnswersForm(fb: FormBuilder) { return fb.nonNullable.group({usesMountainTime: [null as boolean | null],elevatedRadonKnown: [null as boolean | null]}); }
export function restoreKansasListingAnswers(saved: Partial<KansasListingAnswers> | null | undefined): KansasListingAnswers { return {usesMountainTime: saved?.usesMountainTime ?? null,elevatedRadonKnown: saved?.elevatedRadonKnown ?? null}; }
