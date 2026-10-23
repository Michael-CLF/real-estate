import type {FormBuilder} from '@angular/forms';
export interface ArkansasListingAnswers {
}
export function createArkansasListingAnswersForm(fb:FormBuilder) {return fb.nonNullable.group({});}
export function restoreArkansasListingAnswers(saved:Partial<ArkansasListingAnswers>|null|undefined):ArkansasListingAnswers {return {};}
