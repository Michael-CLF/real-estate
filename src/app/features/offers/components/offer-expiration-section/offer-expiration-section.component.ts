import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  AbstractControl,
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';

@Component({
  selector:
    'app-offer-expiration-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './offer-expiration-section.component.html',

  styleUrl:
    './offer-expiration-section.component.scss',

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
export class OfferExpirationSectionComponent {

  private readonly parentFormDirective =
    inject(FormGroupDirective);

  readonly minimumDate =
    formatLocalDate(
      new Date()
    );

  get sectionForm(): FormGroup {
    const section =
      this.parentFormDirective
        .form
        .get(
          'offerExpiration'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The offerExpiration offer section is unavailable.'
      );
    }

    return section;
  }

  get expirationDateTimeInvalid():
    boolean {
    const dateControl =
      this.control(
        'expirationDate'
      );

    const timeControl =
      this.control(
        'expirationTime'
      );

    const wasInteractedWith =
      dateControl?.touched === true ||
      dateControl?.dirty === true ||
      timeControl?.touched === true ||
      timeControl?.dirty === true;

    return (
      wasInteractedWith &&
      (
        this.sectionForm.hasError(
          'expirationNotFuture'
        ) ||
        this.sectionForm.hasError(
          'invalidExpiration'
        )
      )
    );
  }

  get expirationErrorMessage():
    string {
    if (
      this.sectionForm.hasError(
        'expirationNotFuture'
      )
    ) {
      return 'The offer expiration must be in the future.';
    }

    if (
      this.sectionForm.hasError(
        'invalidExpiration'
      )
    ) {
      return 'Enter a valid expiration date and time.';
    }

    return '';
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

    return 'Review the information entered in this field.';
  }
}

function formatLocalDate(
  date: Date
): string {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}