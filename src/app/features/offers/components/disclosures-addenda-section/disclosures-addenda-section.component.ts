import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  WritableSignal,
  inject,
  input,
  signal
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
    'app-disclosures-addenda-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './disclosures-addenda-section.component.html',

  styleUrl:
    './disclosures-addenda-section.component.scss',

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
export class DisclosuresAddendaSectionComponent
  implements OnInit {

  readonly listingUid =
    input.required<string>();

  private readonly parentFormDirective =
    inject(FormGroupDirective);

  private readonly destroyRef =
    inject(DestroyRef);

  get sectionForm(): FormGroup {
    const section =
      this.parentFormDirective
        .form
        .get(
          'disclosuresAddenda'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The disclosuresAddenda offer section is unavailable.'
      );
    }

    return section;
  }

  get residentialPropertyStatus(): string {
    return this.status(
      'residentialPropertyStatus'
    );
  }

  get mineralOilGasRightsStatus(): string {
    return this.status(
      'mineralOilGasRightsStatus'
    );
  }

  get residentialPropertyDocumentAttached():
    boolean {
    return this.hasText(
      'residentialPropertyDocumentUid'
    );
  }

  get mineralOilGasRightsDocumentAttached():
    boolean {
    return this.hasText(
      'mineralOilGasRightsDocumentUid'
    );
  }

  ngOnInit(): void {
    this.watchExemptionReason(
      'residentialPropertyStatus',
      'residentialPropertyExemptionReason'
    );

    this.watchExemptionReason(
      'mineralOilGasRightsStatus',
      'mineralOilGasRightsExemptionReason'
    );
  }

  control(
    controlName: string
  ): AbstractControl | null {
    return this.sectionForm.get(
      controlName
    );
  }

  status(
    controlName: string
  ): string {
    return String(
      this.control(
        controlName
      )?.value ?? ''
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

    if (control.hasError('maxlength')) {
      return 'The entered value is too long.';
    }

    return 'Review the information entered in this field.';
  }

  private watchExemptionReason(
    statusControlName: string,
    reasonControlName: string
  ): void {
    this.control(
      statusControlName
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            statusControlName
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        (status) => {
          const reasonControl =
            this.control(
              reasonControlName
            );

          if (status === 'exempt') {
            reasonControl?.setValidators([
              Validators.required,
              Validators.maxLength(500)
            ]);
          } else {
            reasonControl?.setValidators([
              Validators.maxLength(500)
            ]);
          }

          reasonControl
            ?.updateValueAndValidity({
              emitEvent: false
            });
        }
      );
  }

  private hasText(
    controlName: string
  ): boolean {
    const value =
      this.control(
        controlName
      )?.value;

    return (
      typeof value === 'string' &&
      value.trim().length > 0
    );
  }
}
