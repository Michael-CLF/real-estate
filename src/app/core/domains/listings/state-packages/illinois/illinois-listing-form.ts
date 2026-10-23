import type {FormBuilder} from '@angular/forms';
export interface IllinoisListingAnswers {
 readonly disclosureExemptionClaimed: boolean | null;
 readonly radonExemptionClaimed: boolean | null;
}
export function createIllinoisListingAnswersForm(fb:FormBuilder) {return fb.nonNullable.group({disclosureExemptionClaimed:[null as boolean|null],radonExemptionClaimed:[null as boolean|null]});}
export function restoreIllinoisListingAnswers(saved:Partial<IllinoisListingAnswers>|null|undefined):IllinoisListingAnswers {return {disclosureExemptionClaimed:saved?.disclosureExemptionClaimed??null,radonExemptionClaimed:saved?.radonExemptionClaimed??null};}
