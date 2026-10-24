import type {FormBuilder} from '@angular/forms';
export interface PennsylvaniaListingAnswers {readonly disclosureExemptionClaimed:boolean|null;}
export function createPennsylvaniaListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({disclosureExemptionClaimed:[null as boolean|null]});}
export function restorePennsylvaniaListingAnswers(saved:Partial<PennsylvaniaListingAnswers>|null|undefined):PennsylvaniaListingAnswers{return {disclosureExemptionClaimed:saved?.disclosureExemptionClaimed??null};}
