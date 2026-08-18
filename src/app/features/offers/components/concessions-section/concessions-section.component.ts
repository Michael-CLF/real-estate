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
    'app-concessions-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './concessions-section.component.html',

  styleUrl:
    './concessions-section.component.scss',

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
export class ConcessionsSectionComponent
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
          'concessions'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The concessions offer section is unavailable.'
      );
    }

    return section;
  }

  get closingCostsRequested():
    boolean {
    return (
      this.control(
        'sellerPaidClosingCostsRequested'
      )?.value === true
    );
  }

  get repairCreditRequested():
    boolean {
    return (
      this.control(
        'repairCreditRequested'
      )?.value === true
    );
  }

  ngOnInit(): void {
    this.control(
      'sellerPaidClosingCostsRequested'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'sellerPaidClosingCostsRequested'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateClosingCostValidators();
        }
      );

    this.control(
      'repairCreditRequested'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'repairCreditRequested'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateRepairCreditValidators();
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

  private updateClosingCostValidators():
    void {
    const amountControl =
      this.control(
        'sellerPaidClosingCostsAmount'
      );

    const percentageControl =
      this.control(
        'sellerPaidClosingCostsPercentage'
      );

    if (this.closingCostsRequested) {
      amountControl?.setValidators([
        Validators.required,
        Validators.min(1)
      ]);
    } else {
      amountControl?.setValidators([
        Validators.min(0)
      ]);
    }

    percentageControl?.setValidators([
      Validators.min(0),
      Validators.max(100)
    ]);

    amountControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    percentageControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }

  private updateRepairCreditValidators():
    void {
    const amountControl =
      this.control(
        'repairCreditAmount'
      );

    if (this.repairCreditRequested) {
      amountControl?.setValidators([
        Validators.required,
        Validators.min(1)
      ]);
    } else {
      amountControl?.setValidators([
        Validators.min(0)
      ]);
    }

    amountControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }
}