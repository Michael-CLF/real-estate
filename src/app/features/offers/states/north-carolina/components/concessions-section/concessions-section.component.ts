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
    'app-concessions-section',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    CurrencyInputDirective
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

  get concessionType(): string {
    return String(
      this.control(
        'concessionType'
      )?.value ?? 'none'
    );
  }

  get homeWarrantyRequested():
    boolean {
    return this.control(
      'homeWarrantyRequested'
    )?.value === true;
  }

  ngOnInit(): void {
    this.control(
      'concessionType'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'concessionType'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateConcessionValidators();
        }
      );

    this.control(
      'homeWarrantyRequested'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'homeWarrantyRequested'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateWarrantyValidator();
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
      return 'Enter a value greater than zero.';
    }

    if (control.hasError('max')) {
      return 'Enter a percentage no greater than 100.';
    }

    return 'Review the information entered in this field.';
  }

  private updateConcessionValidators():
    void {
    const amountControl =
      this.control(
        'sellerConcessionAmount'
      );

    const percentageControl =
      this.control(
        'sellerConcessionPercentage'
      );

    if (this.concessionType === 'amount') {
      amountControl?.setValidators([
        Validators.required,
        Validators.min(0.01)
      ]);

      percentageControl?.setValidators([
        Validators.min(0),
        Validators.max(100)
      ]);
    } else if (
      this.concessionType ===
        'percentage'
    ) {
      amountControl?.setValidators([
        Validators.min(0)
      ]);

      percentageControl?.setValidators([
        Validators.required,
        Validators.min(0.01),
        Validators.max(100)
      ]);
    } else {
      amountControl?.setValidators([
        Validators.min(0)
      ]);

      percentageControl?.setValidators([
        Validators.min(0),
        Validators.max(100)
      ]);
    }

    amountControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    percentageControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }

  private updateWarrantyValidator():
    void {
    const amountControl =
      this.control(
        'homeWarrantyAmount'
      );

    if (this.homeWarrantyRequested) {
      amountControl?.setValidators([
        Validators.required,
        Validators.min(0.01)
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
