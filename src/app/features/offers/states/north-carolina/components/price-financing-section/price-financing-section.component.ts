import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject
} from '@angular/core';

import {
  AbstractControl,
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  startWith
} from 'rxjs';

import {
  CurrencyInputDirective
} from '../../../../../offers/directives/currency-input.directive';


@Component({
  selector:
    'app-price-financing-section',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    CurrencyInputDirective
  ],

  templateUrl:
    './price-financing-section.component.html',

  styleUrl:
    './price-financing-section.component.scss',

  viewProviders: [
    {
      provide:
        ControlContainer,

      useExisting:
        FormGroupDirective
    }
  ],

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class PriceFinancingSectionComponent
implements OnInit {

  private readonly parentFormDirective =
    inject(FormGroupDirective);

  private readonly destroyRef =
    inject(DestroyRef);

  get sectionForm(): FormGroup {
    const section =
      this.parentFormDirective
        .form
        .get(
          'priceFinancing'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The priceFinancing offer section is unavailable.'
      );
    }

    return section;
  }

  get financingMethod(): string {
    return String(
      this.control(
        'financingMethod'
      )?.value ?? ''
    );
  }

  get otherPropertyWillFundPurchase():
    boolean {
    return this.control(
      'otherPropertyWillFundPurchase'
    )?.value === true;
  }

  ngOnInit(): void {
    this.control(
      'otherPropertyWillFundPurchase'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'otherPropertyWillFundPurchase'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateOtherPropertyValidator();
        }
      );
  }

  control(
    controlName: string
  ): AbstractControl | null {
    return this.sectionForm.get(
      controlName
    );
  }

  isInvalid(
    controlName: string
  ): boolean {
    const control =
      this.control(
        controlName
      );

    return Boolean(
      control &&
      control.invalid &&
      (
        control.touched ||
        control.dirty
      )
    );
  }

  errorMessage(
    controlName: string
  ): string {
    const control =
      this.control(
        controlName
      );

    if (!control?.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return 'This field is required.';
    }

    if (control.hasError('pattern')) {
      return 'Select cash or loan.';
    }

    if (control.hasError('min')) {
      return 'Enter an amount greater than zero.';
    }

    if (control.hasError('maxlength')) {
      return 'The entered value is too long.';
    }

    return 'Review the information entered in this field.';
  }

  private updateOtherPropertyValidator():
    void {
    const descriptionControl =
      this.control(
        'otherPropertyDescription'
      );

    if (
      this.otherPropertyWillFundPurchase
    ) {
      descriptionControl
        ?.setValidators([
          Validators.required,
          Validators.maxLength(500)
        ]);
    } else {
      descriptionControl
        ?.setValidators([
          Validators.maxLength(500)
        ]);
    }

    descriptionControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }
}
