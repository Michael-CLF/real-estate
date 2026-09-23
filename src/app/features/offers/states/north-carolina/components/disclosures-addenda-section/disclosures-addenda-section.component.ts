import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  WritableSignal,
  inject,
  input,
  signal
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

import {
  ListingDisclosureDocument
} from '../../../../../../core/domains/disclosures/models/listing-disclosure-document.model';

import {
  ListingDisclosureService
} from '../../../../../../core/domains/disclosures/services/listing-disclosure.service';

import {
  DisclosureDocumentType
} from '../../../../../../core/domains/disclosures/models/state-disclosure-requirement.model';


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
export class DisclosuresAddendaSectionComponent
implements OnInit {

  private readonly parentFormDirective =
    inject(FormGroupDirective);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly disclosureService =
    inject(ListingDisclosureService);

  readonly listingUid =
    input.required<string>();

  readonly loadingDocuments =
    signal(true);

  readonly documentError =
    signal('');

  readonly openingDocumentType =
    signal<DisclosureDocumentType | null>(
      null
    );

  readonly residentialPropertyDocument =
    signal<ListingDisclosureDocument | null>(
      null
    );

  readonly mineralOilGasRightsDocument =
    signal<ListingDisclosureDocument | null>(
      null
    );

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

  get residentialPropertyStatus(): string {
    return this.status(
      'residentialPropertyStatus'
    );
  }

  get residentialPropertyDocumentAttached(): boolean {
    return (
      this.residentialPropertyDocument() !== null
    );
  }

  get mineralOilGasRightsStatus(): string {
    return this.status(
      'mineralOilGasRightsStatus'
    );
  }

  get mineralOilGasRightsDocumentAttached(): boolean {
    return (
      this.mineralOilGasRightsDocument() !== null
    );
  }

  ngOnInit(): void {
    this.watchExemptionReason(
      'residentialPropertyStatus',
      'residentialPropertyExemptionReason'
    );

    this.watchExemptionReason(
      'mineralOilGasRightsStatus',
      'mineralOilGasRightsExemptionReason'
    );

    this.watchDisclosureSelection(
      'residentialPropertyStatus',
      'residentialPropertyDocumentUid',
      'residentialPropertyDocumentVersionId',
      this.residentialPropertyDocument
    );

    this.watchDisclosureSelection(
      'mineralOilGasRightsStatus',
      'mineralOilGasRightsDocumentUid',
      'mineralOilGasRightsDocumentVersionId',
      this.mineralOilGasRightsDocument
    );

    this.watchAcknowledgementPrerequisite(
      'residentialPropertyStatus',
      'residentialPropertyAcknowledged'
    );

    this.watchAcknowledgementPrerequisite(
      'mineralOilGasRightsStatus',
      'mineralOilGasRightsAcknowledged'
    );

    void this.loadListingDisclosures();
  }

  validateAcknowledgement(
    statusControlName: string,
    acknowledgementControlName: string,
    event: Event
  ): void {
    const checkbox =
      event.target as HTMLInputElement;

    if (!checkbox.checked) {
      return;
    }

    const statusControl =
      this.control(statusControlName);

    if (statusControl?.value) {
      return;
    }

    const acknowledgementControl =
      this.control(
        acknowledgementControlName
      );

    acknowledgementControl?.setValue(
      false
    );

    acknowledgementControl?.markAsTouched();
    statusControl?.markAsTouched();

    statusControl?.updateValueAndValidity({
      emitEvent: false
    });
  }

  async openDisclosure(
    documentType: DisclosureDocumentType
  ): Promise<void> {
    const disclosure =
      documentType ===
        'residential-property-owners-association'
        ? this.residentialPropertyDocument()
        : this.mineralOilGasRightsDocument();

    if (!disclosure) {
      return;
    }

    this.documentError.set('');
    this.openingDocumentType.set(
      documentType
    );

    try {
      await this.disclosureService
        .openDisclosure(disclosure);
    } catch (error) {
      this.documentError.set(
        error instanceof Error
          ? error.message
          : 'The disclosure document could not be opened.'
      );
    } finally {
      this.openingDocumentType.set(null);
    }
  }

  control(
    controlName: string
  ): AbstractControl | null {
    return this.sectionForm.get(
      controlName
    );
  }

  status(
    controlName: string
  ): string {
    return String(
      this.control(
        controlName
      )?.value ?? ''
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

  private watchExemptionReason(
    statusControlName: string,
    reasonControlName: string
  ): void {
    this.control(
      statusControlName
    )
      ?.valueChanges
      .pipe(
        startWith(
          this.control(
            statusControlName
          )?.value
        ),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        (status) => {
          const reasonControl =
            this.control(
              reasonControlName
            );

          if (status === 'exempt') {
            reasonControl?.setValidators([
              Validators.required,
              Validators.maxLength(500)
            ]);
          } else {
            reasonControl?.setValidators([
              Validators.maxLength(500)
            ]);
          }

          reasonControl
            ?.updateValueAndValidity({
              emitEvent: false
            });
        }
      );
  }

  private watchAcknowledgementPrerequisite(
    statusControlName: string,
    acknowledgementControlName: string
  ): void {
    const statusControl =
      this.control(statusControlName);

    const acknowledgementControl =
      this.control(
        acknowledgementControlName
      );

    statusControl
      ?.valueChanges
      .pipe(
        startWith(statusControl.value),
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        status => {
          if (
            !status &&
            acknowledgementControl
              ?.value === true
          ) {
            acknowledgementControl
              .setValue(false);
          }
        }
      );
  }

  private async loadListingDisclosures():
    Promise<void> {
    this.loadingDocuments.set(true);
    this.documentError.set('');

    try {
      const [
        residentialPropertyDocument,
        mineralOilGasRightsDocument
      ] = await Promise.all([
        this.loadDisclosureVersion(
          'residential-property-owners-association',
          'residentialPropertyDocumentUid',
          'residentialPropertyDocumentVersionId'
        ),

        this.loadDisclosureVersion(
          'mineral-oil-gas-rights',
          'mineralOilGasRightsDocumentUid',
          'mineralOilGasRightsDocumentVersionId'
        )
      ]);

      this.residentialPropertyDocument.set(
        residentialPropertyDocument
      );

      this.mineralOilGasRightsDocument.set(
        mineralOilGasRightsDocument
      );

      this.synchronizeDisclosureSelection(
        'residentialPropertyStatus',
        'residentialPropertyDocumentUid',
        'residentialPropertyDocumentVersionId',
        this.residentialPropertyDocument
      );

      this.synchronizeDisclosureSelection(
        'mineralOilGasRightsStatus',
        'mineralOilGasRightsDocumentUid',
        'mineralOilGasRightsDocumentVersionId',
        this.mineralOilGasRightsDocument
      );
    } catch (error) {
      this.documentError.set(
        error instanceof Error
          ? error.message
          : 'The listing disclosures could not be loaded.'
      );
    } finally {
      this.loadingDocuments.set(false);
    }
  }

  private async loadDisclosureVersion(
    documentType: DisclosureDocumentType,
    documentUidControlName: string,
    versionIdControlName: string
  ): Promise<ListingDisclosureDocument | null> {
    const savedVersionId =
      String(
        this.control(
          versionIdControlName
        )?.value ?? ''
      ).trim() ||
      String(
        this.control(
          documentUidControlName
        )?.value ?? ''
      ).trim();

    const disclosure = savedVersionId
      ? await this.disclosureService
        .getDisclosureVersion(
          this.listingUid(),
          documentType,
          savedVersionId
        )
      : await this.disclosureService
        .getCurrentDisclosure(
          this.listingUid(),
          documentType
        );

    return disclosure;
  }

  private watchDisclosureSelection(
    statusControlName: string,
    documentUidControlName: string,
    versionIdControlName: string,
    documentSignal:
      WritableSignal<ListingDisclosureDocument | null>
  ): void {
    this.control(
      statusControlName
    )
      ?.valueChanges
      .pipe(
        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          this.synchronizeDisclosureSelection(
            statusControlName,
            documentUidControlName,
            versionIdControlName,
            documentSignal
          );
        }
      );
  }

  private synchronizeDisclosureSelection(
    statusControlName: string,
    documentUidControlName: string,
    versionIdControlName: string,
    documentSignal:
      WritableSignal<ListingDisclosureDocument | null>
  ): void {
    const disclosure =
      documentSignal();

    const received =
      this.status(
        statusControlName
      ) === 'received';

    this.setControlValueIfChanged(
      documentUidControlName,
      received && disclosure
        ? disclosure.id
        : ''
    );

    this.setControlValueIfChanged(
      versionIdControlName,
      received && disclosure
        ? disclosure.versionId
        : ''
    );
  }

  private setControlValueIfChanged(
    controlName: string,
    value: string
  ): void {
    const control =
      this.control(controlName);

    if (control?.value === value) {
      return;
    }

    control?.setValue(value);
  }
}
