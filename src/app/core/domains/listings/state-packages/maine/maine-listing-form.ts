import type {FormBuilder} from '@angular/forms';
export interface MaineListingAnswers {
 readonly disclosureExemptionClaimed: boolean | null;
}
export function createMaineListingAnswersForm(fb:FormBuilder) {return fb.nonNullable.group({disclosureExemptionClaimed:[null as boolean|null]});}
export function restoreMaineListingAnswers(saved:Partial<MaineListingAnswers>|null|undefined):MaineListingAnswers {return {disclosureExemptionClaimed:saved?.disclosureExemptionClaimed??null};}
