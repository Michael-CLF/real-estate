import type {FormBuilder} from '@angular/forms';
export interface KentuckyListingAnswers {readonly usesCentralTime:boolean|null;}
export function createKentuckyListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({usesCentralTime:[null as boolean|null]});}
export function restoreKentuckyListingAnswers(saved:Partial<KentuckyListingAnswers>|null|undefined):KentuckyListingAnswers{return {usesCentralTime:saved?.usesCentralTime??null};}
