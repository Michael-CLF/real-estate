import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import {
  AbstractControl,
  ControlContainer,
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';

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
export class DisclosuresAddendaSectionComponent {

  private readonly parentFormDirective =
    inject(FormGroupDirective);

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

  get supportingDocumentUidsControl():
    FormControl<string[]> {
    const control =
      this.sectionForm.get(
        'supportingDocumentUids'
      );

    if (!(control instanceof FormControl)) {
      throw new Error(
        'The supportingDocumentUids control is unavailable.'
      );
    }

    return control as
      FormControl<string[]>;
  }

  get supportingDocumentCount():
    number {
    return (
      this.supportingDocumentUidsControl
        .value?.length ?? 0
    );
  }

  control(
    controlName: string
  ): AbstractControl | null {
    return this.sectionForm.get(
      controlName
    );
  }

  isSelected(
    controlName: string
  ): boolean {
    return (
      this.control(
        controlName
      )?.value === true
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

    if (control.hasError('maxlength')) {
      return 'The entered value is too long.';
    }

    return 'Review the information entered in this field.';
  }
}