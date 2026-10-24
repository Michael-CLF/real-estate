import type {FormBuilder} from '@angular/forms';
export interface GeorgiaListingAnswers {}
export function createGeorgiaListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({});}
export function restoreGeorgiaListingAnswers(saved:Partial<GeorgiaListingAnswers>|null|undefined):GeorgiaListingAnswers{return {};}
