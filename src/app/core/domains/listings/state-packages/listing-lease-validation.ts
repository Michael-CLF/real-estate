import { Validators, type AbstractControl } from '@angular/forms';
import { requiresStateListingField, type StateListingPackage } from './state-listing-package';

interface ListingLeaseControls {
  readonly leasesExist: AbstractControl;
  readonly residentialLeasesExist: AbstractControl;
  readonly fixtureLeasesExist: AbstractControl;
  readonly naturalResourceLeasesExist: AbstractControl;
}

/** Apply the existing package declarations without changing answers or touch state. */
export function configureListingLeaseValidators(
  controls: ListingLeaseControls,
  statePackage: StateListingPackage,
): void {
  const categoriesRequired = requiresStateListingField(statePackage, 'texasLeaseCategories');
  const generalRequired = !categoriesRequired && requiresStateListingField(statePackage, 'generalLeasesExist');
  controls.leasesExist.setValidators(generalRequired ? [Validators.required] : []);
  const categories = [controls.residentialLeasesExist, controls.fixtureLeasesExist, controls.naturalResourceLeasesExist];
  for (const control of categories) control.setValidators(categoriesRequired ? [Validators.required] : []);
  controls.leasesExist.updateValueAndValidity({ emitEvent: false });
  for (const control of categories) control.updateValueAndValidity({ emitEvent: false });
}
