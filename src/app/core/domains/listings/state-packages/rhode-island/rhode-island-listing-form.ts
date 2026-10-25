import type {FormBuilder} from '@angular/forms';
export interface RhodeIslandListingAnswers {}
export function createRhodeIslandListingAnswersForm(fb:FormBuilder){return fb.nonNullable.group({});}
export function restoreRhodeIslandListingAnswers(saved:Partial<RhodeIslandListingAnswers>|null|undefined):RhodeIslandListingAnswers{return {};}
