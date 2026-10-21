import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import type { ListingContractFacts } from '../../../../core/domains/listings/models/listing.model';
/** Property Type is the seller's condominium-ownership selection. */
export function condominiumOwnershipFromPropertyType(propertyType: string): boolean | null {
  return propertyType ? propertyType === 'condo' : null;
}
export function synchronizeListingCondominiumOwnership(group: FormGroup, propertyType: string): void {
  const control = group.get('isCondominium');
  const answer = condominiumOwnershipFromPropertyType(propertyType);
  if (control && control.value !== answer) control.setValue(answer, { emitEvent: false });
}
export function restoreListingContractFacts(saved?: Partial<ListingContractFacts> | null, propertyType?: string): ListingContractFacts {
  return {isCondominium:propertyType === undefined ? saved?.isCondominium ?? null : condominiumOwnershipFromPropertyType(propertyType),isDeveloperSale:saved?.isDeveloperSale ?? null,
    isLeasehold:saved?.isLeasehold ?? null,dwellingUnitCount:saved?.dwellingUnitCount ?? null};
}
export function createListingContractFactsForm(fb: FormBuilder) {
  return fb.group({isCondominium:new FormControl<boolean|null>(null),isDeveloperSale:new FormControl<boolean|null>(null),
    isLeasehold:new FormControl<boolean|null>(null),dwellingUnitCount:new FormControl<number|null>(null,[Validators.min(2),Validators.max(999),Validators.pattern(/^[0-9]+$/)])});
}
@Component({selector:'app-listing-contract-facts',standalone:true,imports:[ReactiveFormsModule],
 styleUrl:'./listing-contract-facts.component.scss',changeDetection:ChangeDetectionStrategy.OnPush,template:`
 <section class="seller-statements" [formGroup]="group()">
 <h3>Ownership and sale type</h3>
 @for (question of questions; track question.key) {
 <div class="field"><label [for]="'contract-fact-'+question.key">{{question.label}}</label>
 <select [id]="'contract-fact-'+question.key" [formControlName]="question.key" [required]="requireAnswers()">
 <option [ngValue]="null">Select an answer</option><option [ngValue]="true">Yes</option><option [ngValue]="false">No</option>
 </select>
 @if (group().get(question.key)?.touched && group().get(question.key)?.invalid) {<p class="field-error">Select an answer.</p>}
 </div>}
 @if (propertyType() === 'multi_family') {
 <div class="field"><label for="contract-unit-count">Number of dwelling units</label>
 <input id="contract-unit-count" type="number" formControlName="dwellingUnitCount" min="2" max="999" step="1" [required]="requireUnitCount()" />
 @if (group().get('dwellingUnitCount')?.touched && group().get('dwellingUnitCount')?.invalid) {<p class="field-error">Enter a whole number of dwelling units.</p>}
 </div>}
 </section>`})
export class ListingContractFactsComponent {
 readonly group=input.required<FormGroup>();readonly propertyType=input('');readonly requireAnswers=input(false);readonly requireUnitCount=input(false);
 readonly questions=[{key:'isDeveloperSale',label:'Is this a builder or developer sale, including new construction?'},
 {key:'isLeasehold',label:'Is ownership subject to a ground lease or other leasehold estate?'}];
}
