import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  ListingHoaFeeFrequency,
  LotSizeUnit,
  PropertyType,
} from '../../../../../core/domains/listings/models/listing.model';
import { auth } from '../../../../../core/infrastructure/firebase/firebase';
import type { ListingDisclosureDocument } from '../../../../../core/domains/disclosures/models/listing-disclosure-document.model';
import type { DisclosureDocumentType } from '../../../../../core/domains/disclosures/models/state-disclosure-requirement.model';
import { ListingDisclosureService } from '../../../../../core/domains/disclosures/services/listing-disclosure.service';

type TexasLeaseDocumentType = Extract<
  DisclosureDocumentType,
  | 'texas-residential-leases'
  | 'texas-fixture-leases'
  | 'texas-natural-resource-leases'
>;

interface PropertyTypeOption {
  value: PropertyType;
  label: string;
}

export type PropertyDetailsSellerOwnershipStatus =
  'owned_at_least_one_year' | 'owned_less_than_one_year' | 'does_not_yet_own';

export type PropertyDetailsFuelTankOwnership = 'owned' | 'leased';

export interface PropertyDetailsSellerStatementsFormValue {
  ownershipStatus: PropertyDetailsSellerOwnershipStatus | '';
  leadBasedPaintApplies: boolean | null;
  ownersAssociationApplies: boolean | null;
  fuelTankPresent: boolean | null;
  fuelTankOwnership: PropertyDetailsFuelTankOwnership | '';
  leasesExist: boolean | null;
  residentialLeasesExist: boolean | null;
  fixtureLeasesExist: boolean | null;
  naturalResourceLeasesExist: boolean | null;
  additionalSellerIncluded: boolean;
  additionalSellerLegalName: string;
  additionalSellerEmail: string;
  additionalSellerPhone: string;
}

export interface PropertyDetailsFormValue {
  propertyType: PropertyType | '';
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  lotSize: number | null;
  lotSizeUnit: LotSizeUnit;
  lotNumber: string;
  blockNumber: string;
  subdivisionName: string;
  legalDescription: string;
  description: string;
  hoa?: PropertyDetailsHoaFormValue;
  sellerStatements: PropertyDetailsSellerStatementsFormValue;
}

export interface PropertyDetailsHoaFormValue {
  hasHoa: boolean | null;
  associationName: string;
  managementCompany: string;
  contactPhone: string;
  feeAmount: number | null;
  feeFrequency: ListingHoaFeeFrequency | '';
}

@Component({
  selector: 'app-property-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './property-details-step.component.html',
  styleUrl: './property-details-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyDetailsStepComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly disclosureService = inject(ListingDisclosureService);

  readonly initialValue = input<PropertyDetailsFormValue | null>(null);
  readonly listingUid = input<string | null>(null);
  readonly stateCode = input('');
  readonly isTexasListing = computed(
    () => this.stateCode().trim().toUpperCase() === 'TX'
  );

  readonly currentYear = new Date().getFullYear();

  readonly validityChange = output<boolean>();
  readonly valueChange = output<PropertyDetailsFormValue>();

  protected readonly leaseDocuments = signal<
    Partial<Record<TexasLeaseDocumentType, ListingDisclosureDocument>>
  >({});
  protected readonly selectedLeaseFiles = signal<
    Partial<Record<TexasLeaseDocumentType, File>>
  >({});
  protected readonly uploadingLeaseType = signal<TexasLeaseDocumentType | null>(null);
  protected readonly leaseDocumentError = signal('');
  protected readonly leaseDocumentMessage = signal('');

  readonly propertyTypes: PropertyTypeOption[] = [
    { value: 'condo', label: 'Condo' },
    { value: 'land', label: 'Land' },
    { value: 'mobile', label: 'Mobile Home' },
    { value: 'multi_family', label: 'Multi-Family' },
    { value: 'pud', label: 'Pud' },
    { value: 'single_family', label: 'Single Family' },
    { value: 'townhome', label: 'Townhome' },
  ];

  readonly hoaFeeFrequencies: {
    value: ListingHoaFeeFrequency;
    label: string;
  }[] = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    {
      value: 'semi_annually',
      label: 'Semi-Annually',
    },
    { value: 'annually', label: 'Annually' },
  ];

  readonly form = this.fb.nonNullable.group({
    propertyType: ['' as PropertyType | '', Validators.required],
    bedrooms: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.max(99)],
    ],
    bathrooms: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.max(99)],
    ],
    squareFeet: [
      null as number | null,
      [Validators.required, Validators.min(1), Validators.max(1000000)],
    ],
    yearBuilt: [
      null as number | null,
      [
        Validators.required,
        Validators.min(1600),
        Validators.max(new Date().getFullYear() + 1),
      ],
    ],
    lotSize: [null as number | null, Validators.min(0)],
    lotSizeUnit: ['square_feet' as LotSizeUnit, Validators.required],
    lotNumber: ['', Validators.maxLength(200)],
    blockNumber: ['', Validators.maxLength(200)],
    subdivisionName: ['', Validators.maxLength(500)],
    legalDescription: ['', Validators.maxLength(5000)],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(5000),
      ],
    ],
    hoa: this.fb.nonNullable.group({
      hasHoa: [null as boolean | null],
      feeAmount: [
        null as number | null,
        [Validators.min(0), Validators.max(1000000)],
      ],
      feeFrequency: ['' as ListingHoaFeeFrequency | ''],
      associationName: [''],
      managementCompany: [''],
      contactPhone: [''],
    }),
    sellerStatements: this.fb.nonNullable.group({
      ownershipStatus: [
        '' as PropertyDetailsSellerOwnershipStatus | '',
        Validators.required,
      ],
      leadBasedPaintApplies: [null as boolean | null, Validators.required],
      ownersAssociationApplies: [null as boolean | null, Validators.required],
      fuelTankPresent: [null as boolean | null, Validators.required],
      fuelTankOwnership: ['' as PropertyDetailsFuelTankOwnership | ''],
      leasesExist: [null as boolean | null],
      residentialLeasesExist: [null as boolean | null],
      fixtureLeasesExist: [null as boolean | null],
      naturalResourceLeasesExist: [null as boolean | null],
      additionalSellerIncluded: [false],
      additionalSellerLegalName: [''],
      additionalSellerEmail: [''],
      additionalSellerPhone: [''],
    }),
  });

  constructor() {
    effect(() => {
      const initialValue = this.initialValue();

      if (initialValue) {
        this.form.patchValue(
          {
            ...initialValue,
            hoa: initialValue.hoa ?? {
              hasHoa: null,
              associationName: '',
              managementCompany: '',
              contactPhone: '',
              feeAmount: null,
              feeFrequency: '',
            },
            sellerStatements: initialValue.sellerStatements ?? {
              ownershipStatus: '',
              leadBasedPaintApplies: null,
              ownersAssociationApplies: null,
              fuelTankPresent: null,
              fuelTankOwnership: '',
              leasesExist: null,
              residentialLeasesExist: null,
              fixtureLeasesExist: null,
              naturalResourceLeasesExist: null,
              additionalSellerIncluded: false,
              additionalSellerLegalName: '',
              additionalSellerEmail: '',
              additionalSellerPhone: '',
            },
          },
          {
            emitEvent: false,
          },
        );
      }

      this.configureHoaValidators(
        this.form.controls.hoa.controls.hasHoa.value,
        false,
      );

      this.configureFuelTankValidators(
        this.form.controls.sellerStatements.controls.fuelTankPresent.value,
        false,
      );

      this.configureLeaseValidators(
        this.isTexasListing()
      );

      this.configureAdditionalSellerValidators(
        this.form.controls.sellerStatements.controls.additionalSellerIncluded.value,
        false,
      );

      this.validityChange.emit(this.form.valid);
    });

    this.form.controls.hoa.controls.hasHoa.valueChanges.subscribe((hasHoa) => {
      this.configureHoaValidators(hasHoa, true);

      if (hasHoa !== null) {
        this.form.controls.sellerStatements.controls.ownersAssociationApplies.setValue(
          hasHoa,
          {
            emitEvent: false,
          },
        );
      }

      this.valueChange.emit(
        this.form.getRawValue() as PropertyDetailsFormValue,
      );

      this.validityChange.emit(this.form.valid);
    });

    this.form.controls.sellerStatements.controls.ownersAssociationApplies.valueChanges.subscribe(
      (ownersAssociationApplies) => {
        if (ownersAssociationApplies !== null) {
          this.form.controls.hoa.controls.hasHoa.setValue(
            ownersAssociationApplies,
            {
              emitEvent: false,
            },
          );

          this.configureHoaValidators(
            ownersAssociationApplies,
            ownersAssociationApplies === false,
          );
        }

        this.valueChange.emit(
          this.form.getRawValue() as PropertyDetailsFormValue,
        );

        this.validityChange.emit(this.form.valid);
      },
    );

    this.form.controls.sellerStatements.controls.fuelTankPresent.valueChanges.subscribe(
      (fuelTankPresent) => {
        this.configureFuelTankValidators(fuelTankPresent, true);

        this.valueChange.emit(
          this.form.getRawValue() as PropertyDetailsFormValue,
        );

        this.validityChange.emit(this.form.valid);
      },
    );

    this.form.controls.sellerStatements.controls.additionalSellerIncluded.valueChanges.subscribe(
      (included) => {
        this.configureAdditionalSellerValidators(included, true);
        this.valueChange.emit(
          this.form.getRawValue() as PropertyDetailsFormValue,
        );
        this.validityChange.emit(this.form.valid);
      },
    );

    this.form.valueChanges.subscribe(() => {
      this.valueChange.emit(
        this.form.getRawValue() as PropertyDetailsFormValue,
      );

      this.validityChange.emit(this.form.valid);
    });
  }

  ngOnInit(): void {
    if (this.isTexasListing()) {
      void this.loadLeaseDocuments();
    }
  }

  protected leaseDocumentFor(
    documentType: TexasLeaseDocumentType
  ): ListingDisclosureDocument | null {
    return this.leaseDocuments()[documentType] ?? null;
  }

  protected selectedLeaseFileFor(
    documentType: TexasLeaseDocumentType
  ): File | null {
    return this.selectedLeaseFiles()[documentType] ?? null;
  }

  protected onLeaseFileSelected(
    event: Event,
    documentType: TexasLeaseDocumentType
  ): void {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];

    this.leaseDocumentError.set('');
    this.leaseDocumentMessage.set('');

    if (!file) {
      this.removeSelectedLeaseFile(documentType);
      return;
    }

    if (file.type !== 'application/pdf') {
      inputElement.value = '';
      this.removeSelectedLeaseFile(documentType);
      this.leaseDocumentError.set('Lease documents must be PDF files.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      inputElement.value = '';
      this.removeSelectedLeaseFile(documentType);
      this.leaseDocumentError.set('A lease PDF cannot exceed 15 MB.');
      return;
    }

    this.selectedLeaseFiles.update(current => ({
      ...current,
      [documentType]: file,
    }));
  }

  protected async uploadLeaseDocument(
    documentType: TexasLeaseDocumentType
  ): Promise<void> {
    const listingUid = this.listingUid();
    const sellerUid = auth.currentUser?.uid;
    const file = this.selectedLeaseFileFor(documentType);

    if (!listingUid || !sellerUid || !file || this.uploadingLeaseType()) {
      return;
    }

    this.leaseDocumentError.set('');
    this.leaseDocumentMessage.set('');
    this.uploadingLeaseType.set(documentType);

    try {
      const uploadedDocument = await this.disclosureService.uploadDisclosure(
        sellerUid,
        listingUid,
        'TX',
        documentType,
        file
      );

      this.leaseDocuments.update(current => ({
        ...current,
        [documentType]: uploadedDocument,
      }));
      this.removeSelectedLeaseFile(documentType);
      this.leaseDocumentMessage.set('Lease document uploaded successfully.');
    } catch (error: unknown) {
      this.leaseDocumentError.set(
        error instanceof Error
          ? error.message
          : 'The lease document could not be uploaded.'
      );
    } finally {
      this.uploadingLeaseType.set(null);
    }
  }

  protected async openLeaseDocument(
    document: ListingDisclosureDocument
  ): Promise<void> {
    this.leaseDocumentError.set('');

    try {
      await this.disclosureService.openDisclosure(document);
    } catch (error: unknown) {
      this.leaseDocumentError.set(
        error instanceof Error
          ? error.message
          : 'The lease document could not be opened.'
      );
    }
  }

  private async loadLeaseDocuments(): Promise<void> {
    const listingUid = this.listingUid();

    if (!listingUid) {
      return;
    }

    try {
      const summaries = await this.disclosureService.getListingDisclosures(listingUid);
      const leaseTypes = new Set<TexasLeaseDocumentType>([
        'texas-residential-leases',
        'texas-fixture-leases',
        'texas-natural-resource-leases',
      ]);
      const documents: Partial<
        Record<TexasLeaseDocumentType, ListingDisclosureDocument>
      > = {};

      for (const summary of summaries) {
        if (leaseTypes.has(summary.documentType as TexasLeaseDocumentType)) {
          documents[summary.documentType as TexasLeaseDocumentType] =
            summary.currentDocument;
        }
      }

      this.leaseDocuments.set(documents);
    } catch (error: unknown) {
      this.leaseDocumentError.set(
        error instanceof Error
          ? error.message
          : 'Existing lease documents could not be loaded.'
      );
    }
  }

  private removeSelectedLeaseFile(documentType: TexasLeaseDocumentType): void {
    this.selectedLeaseFiles.update(current => {
      const next = { ...current };
      delete next[documentType];
      return next;
    });
  }

  private configureHoaValidators(
    hasHoa: boolean | null,
    clearValues: boolean,
  ): void {
    const controls = this.form.controls.hoa.controls;

    if (hasHoa === true) {
      controls.feeAmount.setValidators([
        Validators.min(0),
        Validators.max(1000000),
      ]);
      controls.feeFrequency.clearValidators();
      controls.associationName.setValidators([
        Validators.maxLength(200),
      ]);
      controls.managementCompany.setValidators([
        Validators.maxLength(200),
      ]);
    } else {
      controls.feeAmount.clearValidators();
      controls.feeFrequency.clearValidators();
      controls.associationName.clearValidators();
      controls.managementCompany.clearValidators();

      if (clearValues) {
        controls.feeAmount.setValue(null, {
          emitEvent: false,
        });
        controls.feeFrequency.setValue('', {
          emitEvent: false,
        });
        controls.associationName.setValue('', {
          emitEvent: false,
        });
        controls.managementCompany.setValue('', {
          emitEvent: false,
        });
        controls.contactPhone.setValue('', {
          emitEvent: false,
        });
      }
    }

    controls.feeAmount.updateValueAndValidity({ emitEvent: false });
    controls.feeFrequency.updateValueAndValidity({ emitEvent: false });
    controls.associationName.updateValueAndValidity({ emitEvent: false });
    controls.managementCompany.updateValueAndValidity({ emitEvent: false });
  }

  private configureFuelTankValidators(
    fuelTankPresent: boolean | null,
    clearValue: boolean,
  ): void {
    const fuelTankOwnership =
      this.form.controls.sellerStatements.controls.fuelTankOwnership;

    if (fuelTankPresent === true) {
      fuelTankOwnership.setValidators([Validators.required]);
    } else {
      fuelTankOwnership.clearValidators();

      if (clearValue) {
        fuelTankOwnership.setValue('', {
          emitEvent: false,
        });
      }
    }

    fuelTankOwnership.updateValueAndValidity({
      emitEvent: false,
    });
  }

  private configureLeaseValidators(
    isTexasListing: boolean
  ): void {
    const controls =
      this.form.controls.sellerStatements.controls;
    const texasLeaseControls = [
      controls.residentialLeasesExist,
      controls.fixtureLeasesExist,
      controls.naturalResourceLeasesExist,
    ];

    if (isTexasListing) {
      controls.leasesExist.clearValidators();
      texasLeaseControls.forEach(control =>
        control.setValidators([Validators.required])
      );
    } else {
      controls.leasesExist.setValidators([Validators.required]);
      texasLeaseControls.forEach(control =>
        control.clearValidators()
      );
    }

    controls.leasesExist.updateValueAndValidity({
      emitEvent: false,
    });
    texasLeaseControls.forEach(control =>
      control.updateValueAndValidity({ emitEvent: false })
    );
  }

  private configureAdditionalSellerValidators(
    included: boolean,
    clearValues: boolean,
  ): void {
    const controls = this.form.controls.sellerStatements.controls;
    const fields = [
      controls.additionalSellerLegalName,
      controls.additionalSellerEmail,
      controls.additionalSellerPhone,
    ];

    if (included) {
      controls.additionalSellerLegalName.setValidators([
        Validators.required,
        Validators.maxLength(300),
      ]);
      controls.additionalSellerEmail.setValidators([
        Validators.required,
        Validators.email,
        Validators.maxLength(320),
      ]);
      controls.additionalSellerPhone.setValidators([
        Validators.required,
        Validators.maxLength(50),
      ]);
    } else {
      fields.forEach(control => control.clearValidators());
      if (clearValues) {
        fields.forEach(control => control.setValue('', { emitEvent: false }));
      }
    }

    fields.forEach(control =>
      control.updateValueAndValidity({ emitEvent: false })
    );
  }
}
