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
    'app-additional-terms-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './additional-terms-section.component.html',

  styleUrl:
    './additional-terms-section.component.scss',

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
export class AdditionalTermsSectionComponent
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
          'additionalTerms'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The additionalTerms offer section is unavailable.'
      );
    }

    return section;
  }

  get hasAdditionalTerms():
    boolean {
    return (
      this.control(
        'hasAdditionalTerms'
      )?.value === true
    );
  }

  get attorneyDraftedLanguageRequired():
    boolean {
    return (
      this.control(
        'attorneyDraftedLanguageRequired'
      )?.value === true
    );
  }

  get attorneyReviewStatus(): string {
    return String(
      this.control(
        'attorneyReviewStatus'
      )?.value ??
      'not_required'
    );
  }

  ngOnInit(): void {
    this.control(
      'hasAdditionalTerms'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'hasAdditionalTerms'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateAdditionalTermsValidators();
        }
      );

    this.control(
      'attorneyDraftedLanguageRequired'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'attorneyDraftedLanguageRequired'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateAttorneyReviewStatus();
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
      return 'Describe the requested business term.';
    }

    if (control.hasError('maxlength')) {
      return 'The entered value is too long.';
    }

    return 'Review the information entered in this field.';
  }

  private updateAdditionalTermsValidators():
    void {
    const termsControl =
      this.control(
        'standardRequestedTerms'
      );

    if (this.hasAdditionalTerms) {
      termsControl?.setValidators([
        Validators.required,
        Validators.maxLength(1500)
      ]);
    } else {
      termsControl?.setValidators([
        Validators.maxLength(1500)
      ]);
    }

    termsControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    if (!this.hasAdditionalTerms) {
      this.control(
        'attorneyDraftedLanguageRequired'
      )?.setValue(
        false,
        {
          emitEvent: true
        }
      );
    }
  }

  private updateAttorneyReviewStatus():
    void {
    const statusControl =
      this.control(
        'attorneyReviewStatus'
      );

    if (
      this.attorneyDraftedLanguageRequired
    ) {
      if (
        statusControl?.value ===
          'not_required'
      ) {
        statusControl.setValue(
          'required',
          {
            emitEvent: false
          }
        );
      }

      return;
    }

    statusControl?.setValue(
      'not_required',
      {
        emitEvent: false
      }
    );
  }
}