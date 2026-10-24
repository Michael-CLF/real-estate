import type {FormBuilder} from '@angular/forms';
export interface NorthDakotaListingAnswers {readonly usesMountainTime:boolean|null;readonly disclosureExemptionClaimed:boolean|null;readonly radonTestsKnown:boolean|null;}
export function createNorthDakotaListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({usesMountainTime:[null as boolean|null],disclosureExemptionClaimed:[null as boolean|null],radonTestsKnown:[null as boolean|null]});}
export function restoreNorthDakotaListingAnswers(saved:Partial<NorthDakotaListingAnswers>|null|undefined):NorthDakotaListingAnswers{return {usesMountainTime:saved?.usesMountainTime??null,disclosureExemptionClaimed:saved?.disclosureExemptionClaimed??null,radonTestsKnown:saved?.radonTestsKnown??null};}
