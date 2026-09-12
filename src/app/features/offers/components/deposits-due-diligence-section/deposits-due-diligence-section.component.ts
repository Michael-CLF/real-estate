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
} from '../../directives/currency-input.directive';


@Component({
  selector:
    'app-deposits-due-diligence-section',

  standalone: true,

  imports: [
    ReactiveFormsModule,
    CurrencyInputDirective
  ],

  templateUrl:
    './deposits-due-diligence-section.component.html',

  styleUrl:
    './deposits-due-diligence-section.component.scss',

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
export class DepositsDueDiligenceSectionComponent
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
          'depositsDueDiligence'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The depositsDueDiligence offer section is unavailable.'
      );
    }

    return section;
  }

  get deadlineType(): string {
    return String(
      this.control(
        'dueDiligenceDeadlineType'
      )?.value ?? ''
    );
  }

  ngOnInit(): void {
    this.control(
      'dueDiligenceDeadlineType'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'dueDiligenceDeadlineType'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateDeadlineValidators();
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
      return controlName ===
        'depositDeliveryDays'
        ? 'Enter a whole number of calendar days.'
        : 'Select a valid due-diligence deadline.';
    }

    if (control.hasError('min')) {
      return controlName ===
        'depositDeliveryDays'
        ? 'Enter at least 1 calendar day.'
        : 'Enter zero or a greater amount.';
    }

    if (control.hasError('max')) {
      return controlName ===
        'depositDeliveryDays'
        ? 'The delivery period cannot exceed 30 days.'
        : 'The number of days cannot exceed 365.';
    }

    if (control.hasError('maxlength')) {
      return 'The entered value is too long.';
    }

    return 'Review the information entered in this field.';
  }

  private updateDeadlineValidators():
    void {
    const dateControl =
      this.control(
        'dueDiligenceEndDate'
      );

    const daysControl =
      this.control(
        'dueDiligenceDaysAfterEffectiveDate'
      );

    if (
      this.deadlineType ===
        'specific_date'
    ) {
      dateControl?.setValidators([
        Validators.required
      ]);

      daysControl?.setValidators([
        Validators.min(1),
        Validators.max(365)
      ]);
    } else if (
      this.deadlineType ===
        'days_after_effective_date'
    ) {
      dateControl?.clearValidators();

      daysControl?.setValidators([
        Validators.required,
        Validators.min(1),
        Validators.max(365)
      ]);
    } else {
      dateControl?.clearValidators();

      daysControl?.setValidators([
        Validators.min(1),
        Validators.max(365)
      ]);
    }

    dateControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    daysControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }
}
