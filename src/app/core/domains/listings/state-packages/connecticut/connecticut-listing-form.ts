import type {FormBuilder} from '@angular/forms';
export interface ConnecticutListingAnswers {}
export function createConnecticutListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({});}
export function restoreConnecticutListingAnswers(saved:Partial<ConnecticutListingAnswers>|null|undefined):ConnecticutListingAnswers{return {};}
