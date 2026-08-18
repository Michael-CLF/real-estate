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
    'app-property-inclusions-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './property-inclusions-section.component.html',

  styleUrl:
    './property-inclusions-section.component.scss',

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
export class PropertyInclusionsSectionComponent {

  private readonly parentFormDirective =
    inject(FormGroupDirective);

  get sectionForm(): FormGroup {
    const section =
      this.parentFormDirective
        .form
        .get(
          'propertyInclusions'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The propertyInclusions offer section is unavailable.'
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