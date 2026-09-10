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
export class PropertyInclusionsSectionComponent
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
          'propertyInclusions'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The propertyInclusions offer section is unavailable.'
      );
    }

    return section;
  }

  get manufacturedHomeIncluded():
    boolean {
    return this.isSelected(
      'manufacturedHomeIncluded'
    );
  }

  get separatePropertyIncluded():
    boolean {
    return this.isSelected(
      'separatePropertyIncluded'
    );
  }

  ngOnInit(): void {
    this.control(
      'separatePropertyIncluded'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'separatePropertyIncluded'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateSeparatePropertyValidator();
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

  isSelected(
    controlName: string
  ): boolean {
    return this.control(
      controlName
    )?.value === true;
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

  private updateSeparatePropertyValidator():
    void {
    const descriptionControl =
      this.control(
        'separatePropertyDescription'
      );

    if (this.separatePropertyIncluded) {
      descriptionControl
        ?.setValidators([
          Validators.required,
          Validators.maxLength(1500)
        ]);
    } else {
      descriptionControl
        ?.setValidators([
          Validators.maxLength(1500)
        ]);
    }

    descriptionControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }
}
