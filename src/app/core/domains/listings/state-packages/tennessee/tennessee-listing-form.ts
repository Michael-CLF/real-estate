import type {FormBuilder} from '@angular/forms';
export interface TennesseeListingAnswers {readonly usesCentralTime:boolean|null;readonly propertyNoticesApply:boolean|null;}
export function createTennesseeListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({usesCentralTime:[null as boolean|null],propertyNoticesApply:[null as boolean|null]});}
export function restoreTennesseeListingAnswers(saved:Partial<TennesseeListingAnswers>|null|undefined):TennesseeListingAnswers{return {usesCentralTime:saved?.usesCentralTime??null,propertyNoticesApply:saved?.propertyNoticesApply??null};}
