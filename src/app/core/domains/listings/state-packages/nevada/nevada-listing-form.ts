import type {FormBuilder} from '@angular/forms';
export interface NevadaListingAnswers {readonly usesMountainTime:boolean|null;readonly openRangeAdjacent:boolean|null;}
export function createNevadaListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({usesMountainTime:[null as boolean|null],openRangeAdjacent:[null as boolean|null]});}
export function restoreNevadaListingAnswers(saved:Partial<NevadaListingAnswers>|null|undefined):NevadaListingAnswers{return {usesMountainTime:saved?.usesMountainTime??null,openRangeAdjacent:saved?.openRangeAdjacent??null};}
