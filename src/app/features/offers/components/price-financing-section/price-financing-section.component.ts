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

@Component({
  selector:
    'app-price-financing-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
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

  get loanType(): string {
    return String(
      this.control(
        'loanType'
      )?.value ?? ''
    );
  }

  get isCashPurchase(): boolean {
    return this.financingMethod ===
      'cash';
  }

  get usesFinancing(): boolean {
    return (
      this.financingMethod ===
        'financing' ||
      this.financingMethod ===
        'cash_and_financing'
    );
  }

  get requiresOtherLoanType():
    boolean {
    return (
      this.usesFinancing &&
      this.loanType === 'other'
    );
  }

  ngOnInit(): void {
    this.control(
      'financingMethod'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'financingMethod'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateFinancingValidators();
        }
      );

    this.control(
      'loanType'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'loanType'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateOtherLoanTypeValidator();
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

    if (control.hasError('min')) {
      return 'Enter an amount greater than zero.';
    }

    if (control.hasError('max')) {
      return 'Enter a percentage no greater than 100.';
    }

    if (control.hasError('maxlength')) {
      return 'The entered value is too long.';
    }

    return 'Review the information entered in this field.';
  }

  private updateFinancingValidators():
    void {
    const loanTypeControl =
      this.control(
        'loanType'
      );

    const loanAmountControl =
      this.control(
        'loanAmount'
      );

    const downPaymentAmountControl =
      this.control(
        'downPaymentAmount'
      );

    const downPaymentPercentageControl =
      this.control(
        'downPaymentPercentage'
      );

    const financingApplicationDaysControl =
      this.control(
        'financingApplicationDays'
      );

    if (this.usesFinancing) {
      loanTypeControl?.setValidators([
        Validators.required
      ]);

      loanAmountControl?.setValidators([
        Validators.required,
        Validators.min(1)
      ]);

      downPaymentAmountControl
        ?.setValidators([
          Validators.required,
          Validators.min(0)
        ]);

      downPaymentPercentageControl
        ?.setValidators([
          Validators.min(0),
          Validators.max(100)
        ]);

      financingApplicationDaysControl
        ?.setValidators([
          Validators.min(0),
          Validators.max(365)
        ]);
    } else {
      loanTypeControl?.clearValidators();

      loanAmountControl?.setValidators([
        Validators.min(0)
      ]);

      downPaymentAmountControl
        ?.setValidators([
          Validators.min(0)
        ]);

      downPaymentPercentageControl
        ?.setValidators([
          Validators.min(0),
          Validators.max(100)
        ]);

      financingApplicationDaysControl
        ?.setValidators([
          Validators.min(0),
          Validators.max(365)
        ]);
    }

    loanTypeControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    loanAmountControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    downPaymentAmountControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    downPaymentPercentageControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    financingApplicationDaysControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    this.updateOtherLoanTypeValidator();
  }

  private updateOtherLoanTypeValidator():
    void {
    const otherLoanTypeControl =
      this.control(
        'otherLoanType'
      );

    if (this.requiresOtherLoanType) {
      otherLoanTypeControl
        ?.setValidators([
          Validators.required,
          Validators.maxLength(100)
        ]);
    } else {
      otherLoanTypeControl
        ?.setValidators([
          Validators.maxLength(100)
        ]);
    }

    otherLoanTypeControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }
}