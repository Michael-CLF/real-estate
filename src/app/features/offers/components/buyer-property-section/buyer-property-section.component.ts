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
    'app-buyer-property-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './buyer-property-section.component.html',

  styleUrl:
    './buyer-property-section.component.scss',

  /*
   * This makes the parent OfferWizard FormGroup available
   * inside this child component. The section can therefore
   * use formGroupName="buyerProperty" without creating a
   * second or disconnected form.
   */
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
export class BuyerPropertySectionComponent {

  private readonly parentFormDirective =
    inject(FormGroupDirective);

  get sectionForm(): FormGroup {
    const section =
      this.parentFormDirective
        .form
        .get(
          'buyerProperty'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The buyerProperty offer section is unavailable.'
      );
    }

    return section;
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

  hasError(
    controlName: string,
    errorName: string
  ): boolean {
    return Boolean(
      this.control(
        controlName
      )?.hasError(
        errorName
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

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control.hasError('pattern')) {
      return 'Enter a valid phone number.';
    }

    if (control.hasError('maxlength')) {
      return 'The entered value is too long.';
    }

    return 'Review the information entered in this field.';
  }

  formatPhoneInput(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const digits =
      input.value
        .replace(
          /\D/g,
          ''
        )
        .slice(0, 10);

    let formatted = '';

    if (digits.length > 0) {
      formatted =
        `(${digits.slice(0, 3)}`;
    }

    if (digits.length >= 3) {
      formatted += ') ';
    }

    if (digits.length > 3) {
      formatted +=
        digits.slice(3, 6);
    }

    if (digits.length >= 6) {
      formatted += '-';
    }

    if (digits.length > 6) {
      formatted +=
        digits.slice(6, 10);
    }

    input.value = formatted;

    this.control(
      'buyerPhone'
    )?.setValue(
      formatted,
      {
        emitEvent: false
      }
    );
  }

  preventAdditionalPhoneDigit(
    event: KeyboardEvent
  ): void {
    const allowedKeys =
      new Set([
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End'
      ]);

    if (
      allowedKeys.has(event.key) ||
      event.ctrlKey ||
      event.metaKey
    ) {
      return;
    }

    /*
     * The phone field accepts numbers only.
     * Formatting characters are added automatically.
     */
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    const currentDigits =
      String(
        this.control(
          'buyerPhone'
        )?.value ?? ''
      ).replace(
        /\D/g,
        ''
      );

    /*
     * Prevent an eleventh digit from being entered.
     * Pasted values are separately truncated by
     * formatPhoneInput().
     */
    if (currentDigits.length >= 10) {
      event.preventDefault();
    }
  }
}