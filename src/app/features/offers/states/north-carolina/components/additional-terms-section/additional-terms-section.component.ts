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
export class AdditionalTermsSectionComponent {

  readonly offerUid =
    input.required<string>();

  readonly offerVersionUid =
    input.required<string>();

  readonly uploadingAdditionalTerms =
    signal(false);

  readonly additionalTermsUploadError =
    signal('');

  readonly additionalTermsFileName =
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
          'additionalTerms'
        );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The additionalTerms offer section is unavailable.'
      );
    }

    return section;
  }

  get hasAdditionalTerms(): boolean {
    return (
      this.control(
        'hasAdditionalTerms'
      )?.value === true
    );
  }

  get preparedBy(): string {
    return String(
      this.control(
        'preparedBy'
      )?.value ?? ''
    );
  }

  get documentAttached(): boolean {
    const value =
      this.control(
        'documentUid'
      )?.value;

    return (
      typeof value === 'string' &&
      value.trim().length > 0
    );
  }

  get preparedByRequired(): boolean {
    return (
      this.hasAdditionalTerms &&
      this.sectionForm.hasError(
        'preparedByRequired'
      ) &&
      (
        this.sectionForm.touched ||
        this.sectionForm.dirty
      )
    );
  }

  get documentRequired(): boolean {
    return (
      this.hasAdditionalTerms &&
      this.sectionForm.hasError(
        'additionalTermsDocumentRequired'
      ) &&
      (
        this.sectionForm.touched ||
        this.sectionForm.dirty
      )
    );
  }

  async uploadAdditionalTerms(
    event: Event
  ): Promise<void> {
    const fileInput =
      event.target as HTMLInputElement;

    const file =
      fileInput.files?.[0];

    if (!file) {
      return;
    }

    this.additionalTermsUploadError
      .set('');

    this.uploadingAdditionalTerms
      .set(true);

    try {
      const result =
        await this.offerDocumentService
          .uploadAttachment(
            this.offerUid(),
            this.offerVersionUid(),
            'additional_terms_exhibit',
            file
          );

      const documentControl =
        this.control(
          'documentUid'
        );

      documentControl?.setValue(
        result.documentUid
      );

      documentControl?.markAsDirty();
      documentControl?.markAsTouched();

      this.additionalTermsFileName
        .set(file.name);
    } catch (error) {
      this.additionalTermsUploadError
        .set(
          error instanceof Error
            ? error.message
            : 'The Additional Terms Exhibit could not be uploaded.'
        );
    } finally {
      this.uploadingAdditionalTerms
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
}
