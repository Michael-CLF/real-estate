import type {FormBuilder} from '@angular/forms';
export interface VirginiaListingAnswers {readonly affirmativeNoticesApply:boolean|null;}
export function createVirginiaListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({affirmativeNoticesApply:[null as boolean|null]});}
export function restoreVirginiaListingAnswers(saved:Partial<VirginiaListingAnswers>|null|undefined):VirginiaListingAnswers{return {affirmativeNoticesApply:saved?.affirmativeNoticesApply??null};}
