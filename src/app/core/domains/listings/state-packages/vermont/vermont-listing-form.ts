import type {FormBuilder} from '@angular/forms';
export interface VermontListingAnswers {}
export function createVermontListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({});}
export function restoreVermontListingAnswers(saved:Partial<VermontListingAnswers>|null|undefined):VermontListingAnswers{return {};}
