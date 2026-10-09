import { Validators, type AbstractControl } from '@angular/forms';
import { COLORADO_LISTING_OPTIONAL_FACTS, type createColoradoPropertyFactsForm, type createColoradoAssumableLoanForm } from './colorado-listing-form';

export function configureColoradoListingFactValidators(
  group: ReturnType<typeof createColoradoPropertyFactsForm>,
  active: boolean,
  choice: (key: typeof COLORADO_LISTING_OPTIONAL_FACTS[number]['key']) => string,
): void {
    const c = group.controls;
    const requiredText = (control: AbstractControl) =>
      typeof control.value === 'string' && control.value.trim()
        ? null
        : { required: true };
    // Errors belong to individual controls, not the whole section.
    group.clearValidators();
    for (const control of Object.values(c)) {
      control.setValidators(Validators.maxLength(4000));
    }
    c.waterSource.setValidators(
      active
        ? [requiredText, Validators.maxLength(4000)]
        : [],
    );
    c.metroDistrict.setValidators(
      active
        ? [
          (control: AbstractControl) =>
            ['covered', 'not_applicable'].includes(control.value)
              ? null
              : control.value === 'unknown'
                ? { districtUnknown: true }
                : { required: true },
        ]
        : [],
    );
    const covered =
      active && c.metroDistrict.value === 'covered';
    c.metroDistrictWebsite.setValidators(
      covered
        ? [
          requiredText,
          (control: AbstractControl) => {
            if (!control.value?.trim()) {
              return null;
            }
            try {
              const url = new URL(control.value.trim());
              return url.protocol === 'https:' &&
                url.hostname.includes('.')
                ? null
                : { districtUrl: true };
            } catch {
              return { districtUrl: true };
            }
          },
          Validators.maxLength(4000),
        ]
        : [],
    );
    c.metroDistrictDisclosure.setValidators(
      covered
        ? [requiredText, Validators.maxLength(4000)]
        : [],
    );
    for (const field of COLORADO_LISTING_OPTIONAL_FACTS) {
      c[field.key].setValidators(
        active && choice(field.key) === 'yes'
          ? [requiredText, Validators.maxLength(4000)]
          : [Validators.maxLength(4000)],
      );
    }
    for (const control of Object.values(c)) {
      control.updateValueAndValidity({ emitEvent: false });
    }
    group.updateValueAndValidity({ emitEvent: false });
}

export function configureColoradoListingLoanValidators(
  group: ReturnType<typeof createColoradoAssumableLoanForm>,
  isColorado: boolean,
): void {
    const controls = group.controls;
    const active = isColorado && controls.available.value;
    const required = active ? [Validators.required] : [];
    controls.balanceAsOf.setValidators(required);
    controls.paymentPeriod.setValidators(required);
    controls.ratePercent.setValidators(active ? [Validators.min(0.01), Validators.max(30)] : []);
    controls.estimatedBalanceDollars.setValidators(active ? [Validators.min(1)] : []);
    controls.principalInterestPaymentDollars.setValidators(active ? [Validators.min(1)] : []);
    controls.escrowOther.setValidators(active ? [Validators.maxLength(180)] : []);
    for (const control of Object.values(controls)) control.updateValueAndValidity({ emitEvent: false });
}

/** Preserve published-listing edit rules, which differ from creation rules. */
export function configureColoradoListingEditValidators(
  group: ReturnType<typeof createColoradoPropertyFactsForm>,
  stateCode: string | undefined,
  status: string | undefined,
): void {
    const editable = stateCode === 'CO' && status === 'active';
    if (!editable) { group.disable({ emitEvent: false }); return; }
    group.enable({ emitEvent: false });
    const requiredText = (control: import('@angular/forms').AbstractControl) =>
      typeof control.value === 'string' && control.value.trim() ? null : { required: true };
    for (const control of Object.values(group.controls)) control.setValidators(Validators.maxLength(4000));
    group.get('waterSource')!.addValidators(requiredText);
    group.get('metroDistrict')!.addValidators(control =>
      ['covered', 'not_applicable'].includes(control.value) ? null : { required: true });
    if (group.get('metroDistrict')!.value === 'covered') {
      group.get('metroDistrictWebsite')!.addValidators([requiredText, Validators.pattern(/^https:\/\/[^\s]+$/)]);
      group.get('metroDistrictDisclosure')!.addValidators(requiredText);
    }
    for (const control of Object.values(group.controls)) control.updateValueAndValidity({ emitEvent: false });
    group.updateValueAndValidity({ emitEvent: false });
}
