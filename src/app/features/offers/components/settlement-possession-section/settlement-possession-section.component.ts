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
    'app-settlement-possession-section',

  standalone: true,

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './settlement-possession-section.component.html',

  styleUrl:
    './settlement-possession-section.component.scss',

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
export class SettlementPossessionSectionComponent
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
          'settlementPossession'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The settlementPossession offer section is unavailable.'
      );
    }

    return section;
  }

  get possessionTiming(): string {
    return String(
      this.control(
        'possessionTiming'
      )?.value ?? ''
    );
  }

  get requiresPossessionNotes():
    boolean {
    return (
      this.possessionTiming !== '' &&
      this.possessionTiming !==
        'at_closing'
    );
  }

  get hasPossessionDateError():
    boolean {
    return (
      this.sectionForm.hasError(
        'possessionBeforeSettlement'
      ) &&
      (
        this.control(
          'proposedSettlementDate'
        )?.touched === true ||
        this.control(
          'proposedPossessionDate'
        )?.touched === true
      )
    );
  }

  ngOnInit(): void {
    this.control(
      'possessionTiming'
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            'possessionTiming'
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.updatePossessionNotesValidator();
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

  private updatePossessionNotesValidator():
    void {
    const notesControl =
      this.control(
        'possessionNotes'
      );

    if (this.requiresPossessionNotes) {
      notesControl?.setValidators([
        Validators.required,
        Validators.maxLength(1000)
      ]);
    } else {
      notesControl?.setValidators([
        Validators.maxLength(1000)
      ]);
    }

    notesControl
      ?.updateValueAndValidity({
        emitEvent: false
      });
  }
}