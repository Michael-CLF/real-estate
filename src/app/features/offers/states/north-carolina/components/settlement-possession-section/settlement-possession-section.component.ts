import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal
} from '@angular/core';

import {
  AbstractControl,
  ControlContainer,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule
} from '@angular/forms';

import {
  OfferDocumentService
} from '../../../../../../core/domains/offers/services/offer-document.service';


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
export class SettlementPossessionSectionComponent {

  readonly offerUid =
    input.required<string>();

  readonly offerVersionUid =
    input.required<string>();

  readonly uploadingPossessionAgreement =
    signal(false);

  readonly possessionAgreementUploadError =
    signal('');

  readonly possessionAgreementFileName =
    signal('');

  private readonly parentFormDirective =
    inject(FormGroupDirective);

  private readonly offerDocumentService =
    inject(OfferDocumentService);

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

  get otherPossessionSelected(): boolean {
    return this.possessionTiming === 'other';
  }

  get hasPossessionAgreementDocument():
    boolean {
    const value =
      this.control(
        'possessionAgreementDocumentUid'
      )?.value;

    return (
      typeof value === 'string' &&
      value.trim().length > 0
    );
  }

  get possessionAgreementRequired():
    boolean {
    return (
      this.otherPossessionSelected &&
      !this.hasPossessionAgreementDocument &&
      (
        this.sectionForm.touched ||
        this.sectionForm.dirty
      )
    );
  }

  async uploadPossessionAgreement(
    event: Event
  ): Promise<void> {
    const fileInput =
      event.target as HTMLInputElement;

    const file =
      fileInput.files?.[0];

    if (!file) {
      return;
    }

    this.possessionAgreementUploadError
      .set('');

    this.uploadingPossessionAgreement
      .set(true);

    try {
      const result =
        await this.offerDocumentService
          .uploadAttachment(
            this.offerUid(),
            this.offerVersionUid(),
            'possession_agreement',
            file
          );

      const documentControl =
        this.control(
          'possessionAgreementDocumentUid'
        );

      documentControl?.setValue(
        result.documentUid
      );

      documentControl?.markAsDirty();
      documentControl?.markAsTouched();

      this.possessionAgreementFileName
        .set(file.name);
    } catch (error) {
      this.possessionAgreementUploadError
        .set(
          error instanceof Error
            ? error.message
            : 'The possession agreement could not be uploaded.'
        );
    } finally {
      this.uploadingPossessionAgreement
        .set(false);

      fileInput.value = '';
    }
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
