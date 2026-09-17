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
    'app-investigations-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './investigations-section.component.html',

  styleUrl:
    './investigations-section.component.scss',

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
export class InvestigationsSectionComponent
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
          'investigations'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The investigations offer section is unavailable.'
      );
    }

    return section;
  }

  get saleOfExistingHomeRequired():
    boolean {
    return (
      this.control(
        'saleOfExistingHomeRequired'
      )?.value === true
    );
  }

  ngOnInit(): void {
    this.control(
      'saleOfExistingHomeRequired'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'saleOfExistingHomeRequired'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updateExistingHomeValidators();
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

    if (control.hasError('maxlength')) {
      return 'The entered value is too long.';
    }

    return 'Review the information entered in this field.';
  }

  private updateExistingHomeValidators():
    void {
    const addressControl =
      this.control(
        'existingHomeAddress'
      );

    const statusControl =
      this.control(
        'existingHomeStatus'
      );

    const deadlineControl =
      this.control(
        'existingHomeDeadline'
      );

    if (
      this.saleOfExistingHomeRequired
    ) {
      addressControl?.setValidators([
        Validators.required,
        Validators.maxLength(300)
      ]);

      statusControl?.setValidators([
        Validators.required
      ]);

      deadlineControl?.setValidators([
        Validators.required
      ]);
    } else {
      addressControl?.setValidators([
        Validators.maxLength(300)
      ]);

      statusControl?.clearValidators();
      deadlineControl?.clearValidators();
    }

    addressControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    statusControl
      ?.updateValueAndValidity({
        emitEvent: false
      });

    deadlineControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }
}