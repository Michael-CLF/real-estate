import type {FormBuilder} from '@angular/forms';
export interface AlaskaListingAnswers {readonly usesAleutianTime:boolean|null;}
export function createAlaskaListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({usesAleutianTime:[null as boolean|null]});}
export function restoreAlaskaListingAnswers(saved:Partial<AlaskaListingAnswers>|null|undefined):AlaskaListingAnswers{return {usesAleutianTime:saved?.usesAleutianTime??null};}
