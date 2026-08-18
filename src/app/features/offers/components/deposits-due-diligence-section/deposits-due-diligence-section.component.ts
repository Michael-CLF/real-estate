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
    'app-deposits-due-diligence-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
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

  get hasAdditionalEarnestMoney():
    boolean {
    const amount =
      Number(
        this.control(
          'additionalEarnestMoneyAmount'
        )?.value ?? 0
      );

    return (
      Number.isFinite(amount) &&
      amount > 0
    );
  }

  ngOnInit(): void {
    this.control(
      'additionalEarnestMoneyAmount'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'additionalEarnestMoneyAmount'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateAdditionalDepositValidator();
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
      return 'Enter an amount or number of days of zero or greater.';
    }

    if (control.hasError('max')) {
      return 'The entered number of days is too large.';
    }

    if (control.hasError('maxlength')) {
      return 'The entered value is too long.';
    }

    return 'Review the information entered in this field.';
  }

  private updateAdditionalDepositValidator():
    void {
    const dueDateControl =
      this.control(
        'additionalEarnestMoneyDueDate'
      );

    if (this.hasAdditionalEarnestMoney) {
      dueDateControl?.setValidators([
        Validators.required
      ]);
    } else {
      dueDateControl?.clearValidators();
    }

    dueDateControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }
}