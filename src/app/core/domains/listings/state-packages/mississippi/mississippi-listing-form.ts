import type {FormBuilder} from '@angular/forms';
export interface MississippiListingAnswers {
}
export function createMississippiListingAnswersForm(fb:FormBuilder) {return fb.nonNullable.group({});}
export function restoreMississippiListingAnswers(saved:Partial<MississippiListingAnswers>|null|undefined):MississippiListingAnswers {return {};}
