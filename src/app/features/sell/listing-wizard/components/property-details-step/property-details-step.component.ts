import { getStateListingFormRestorer } from '../../../../../core/domains/listings/state-packages/state-listing.registry';
import { configureListingStatementValidators } from '../../../../../core/domains/listings/state-packages/listing-statement-validation';
import { configureListingLeaseValidators } from '../../../../../core/domains/listings/state-packages/listing-lease-validation';
import { COLORADO_LISTING_OPTIONAL_FACTS, type ColoradoSellerLoanFormValue } from '../../../../../core/domains/listings/state-packages/colorado/colorado-listing-form';
/*property-details-step.component.ts*/
import type { CaliforniaListingFacts } from '../../../../../core/domains/listings/state-packages/california/california-listing-facts.model';
import type { ColoradoPropertyFacts } from '../../../../../core/domains/offers/state-contracts/colorado/models/colorado-contract-elections';
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
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import type { ListingDisclosureDocument } from '../../../../../core/domains/disclosures/models/listing-disclosure-document.model';
import type { DisclosureDocumentType } from '../../../../../core/domains/disclosures/models/state-disclosure-requirement.model';
import { ListingDisclosureService } from '../../../../../core/domains/disclosures/services/listing-disclosure.service';
import {
  ListingHoaFeeFrequency,
  LotSizeUnit,
  PropertyType,
} from '../../../../../core/domains/listings/models/listing.model';
import { showsStateListingPropertyField, getStateListingPackage, getStateListingQuestionGroups, getStateListingFormFactory, getStateListingFormValidator } from '../../../../../core/domains/listings/state-packages/state-listing.registry';
import { requiresStateListingField } from '../../../../../core/domains/listings/state-packages/state-listing-package';
import { auth } from '../../../../../core/infrastructure/firebase/firebase';
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
  | 'owned_at_least_one_year'
  | 'owned_less_than_one_year'
  | 'does_not_yet_own';
export type PropertyDetailsFuelTankOwnership =
  | 'owned'
  | 'leased';
export interface PropertyDetailsSellerStatementsFormValue {
  southCarolina?: {
    beachfrontApplies: boolean | null;
    futureVacationBookingsExist: boolean | null;
  };
  california?: CaliforniaListingFacts;
  ownershipStatus:
  | PropertyDetailsSellerOwnershipStatus
  | '';
  leadBasedPaintApplies: boolean | null;
  ownersAssociationApplies: boolean | null;
  fuelTankPresent: boolean | null;
  fuelTankOwnership:
  | PropertyDetailsFuelTankOwnership
  | '';
  leasesExist: boolean | null;
  residentialLeasesExist: boolean | null;
  fixtureLeasesExist: boolean | null;
  naturalResourceLeasesExist: boolean | null;
  methamphetamineContaminationKnown: boolean | null;
  additionalSellerIncluded: boolean;
  additionalSellerLegalName: string;
  additionalSellerEmail: string;
  additionalSellerPhone: string;
}
export interface PropertyDetailsHoaFormValue {
  hasHoa: boolean | null;
  associationName: string;
  managementCompany: string;
  contactPhone: string;
  feeAmount: number | null;
  feeFrequency: ListingHoaFeeFrequency | '';
}
export type { ColoradoSellerLoanFormValue } from '../../../../../core/domains/listings/state-packages/colorado/colorado-listing-form';
export interface PropertyDetailsFormValue {
  coloradoPropertyFacts?: ColoradoPropertyFacts;
  coloradoAssumableLoan?: ColoradoSellerLoanFormValue | null;
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
  sellerStatements:
  PropertyDetailsSellerStatementsFormValue;
}
@Component({
  selector: 'app-property-details-step',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl:
    './property-details-step.component.html',
  styleUrl:
    './property-details-step.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class PropertyDetailsStepComponent
  implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly disclosureService =
    inject(ListingDisclosureService);
  readonly initialValue =
    input<PropertyDetailsFormValue | null>(null);
  readonly listingUid =
    input<string | null>(null);
  readonly stateCode = input('');
  readonly stateListingPackage = computed(
    () =>
      getStateListingPackage(
        this.stateCode(),
      ),
  );
  readonly requiresOwnershipStatus = computed(
    () =>
      requiresStateListingField(
        this.stateListingPackage(),
        'ownershipStatus',
      ),
  );
  readonly requiresLeadBasedPaint = computed(
    () =>
      requiresStateListingField(
        this.stateListingPackage(),
        'leadBasedPaintApplies',
      ),
  );
  readonly showsListingLegalDescription = computed(
    () =>
      showsStateListingPropertyField(this.stateCode(), 'legalDescription'),
  );
  readonly requiresFuelTank = computed(
    () =>
      requiresStateListingField(
        this.stateListingPackage(),
        'fuelTankPresent',
      ),
  );
  readonly requiresOwnersAssociation = computed(
    () => requiresStateListingField(this.stateListingPackage(), 'ownersAssociationApplies'),
  );
  readonly requiresGeneralLeases = computed(
    () =>
      requiresStateListingField(
        this.stateListingPackage(),
        'generalLeasesExist',
      ),
  );
  readonly requiresUtahMethamphetamineStatement = computed(() =>
    requiresStateListingField(
      this.stateListingPackage(),
      'utahMethamphetamineContamination',
    ),
  );
  readonly isTexasListing = computed(
    () =>
      this.stateCode()
        .trim()
        .toUpperCase() === 'TX',
  );
  readonly isColoradoListing = computed(() => this.stateCode().trim().toUpperCase() === 'CO');
  readonly currentYear =
    new Date().getFullYear();
  readonly validityChange = output<boolean>();
  readonly valueChange =
    output<PropertyDetailsFormValue>();
  protected readonly leaseDocuments = signal<
    Partial<
      Record<
        TexasLeaseDocumentType,
        ListingDisclosureDocument
      >
    >
  >({});
  protected readonly selectedLeaseFiles = signal<
    Partial<
      Record<
        TexasLeaseDocumentType,
        File
      >
    >
  >({});
  protected readonly uploadingLeaseType =
    signal<TexasLeaseDocumentType | null>(
      null,
    );
  protected readonly leaseDocumentError =
    signal('');
  protected readonly leaseDocumentMessage =
    signal('');
  readonly propertyTypes: PropertyTypeOption[] = [

    {
      value: 'single_family',
      label: 'Single Family',
    },
    {
      value: 'condo',
      label: 'Condo',
    },
    {
      value: 'townhome',
      label: 'Townhome',
    },
    {
      value: 'pud',
      label: 'Pud',
    },
    {
      value: 'mobile',
      label: 'Mobile Home',
    },
    {
      value: 'multi_family',
      label: 'Multi-Family',
    },
    {
      value: 'land',
      label: 'Land',
    },
  ];
  readonly hoaFeeFrequencies: {
    value: ListingHoaFeeFrequency;
    label: string;
  }[] = [
      {
        value: 'monthly',
        label: 'Monthly',
      },
      {
        value: 'quarterly',
        label: 'Quarterly',
      },
      {
        value: 'semi_annually',
        label: 'Semi-Annually',
      },
      {
        value: 'annually',
        label: 'Annually',
      },
    ];
  readonly coloradoOptionalFacts = COLORADO_LISTING_OPTIONAL_FACTS;
  private readonly coloradoFactChoices: Partial<
    Record<
      typeof this.coloradoOptionalFacts[number]['key'],
      'yes' | 'no' | 'unknown' | 'unselected'
    >
  > = {};
  coloradoFactChoice(
    key: typeof this.coloradoOptionalFacts[number]['key'],
  ): 'yes' | 'no' | 'unknown' | 'unselected' {
    const value =
      this.form.controls.coloradoPropertyFacts.controls[key].value.trim();
    if (!value) {
      return this.coloradoFactChoices[key] ?? 'unselected';
    }
    if (/^(none|n\/?a|not applicable)$/i.test(value)) {
      return 'no';
    }
    if (/^unknown$/i.test(value)) {
      return 'unknown';
    }
    return 'yes';
  }
  setColoradoFactChoice(
    key: typeof this.coloradoOptionalFacts[number]['key'],
    event: Event,
  ): void {
    const choice = (event.target as HTMLSelectElement).value;
    if (!['unselected', 'yes', 'no', 'unknown'].includes(choice)) {
      return;
    }
    this.coloradoFactChoices[key] =
      choice as 'yes' | 'no' | 'unknown' | 'unselected';
    const control =
      this.form.controls.coloradoPropertyFacts.controls[key];
    const previous = control.value.trim();
    control.setValue(
      choice === 'no'
        ? 'NONE'
        : choice === 'unknown'
          ? 'UNKNOWN'
          : choice === 'yes' &&
            previous &&
            !/^(none|n\/?a|not applicable|unknown)$/i.test(previous)
            ? previous
            : '',
      { emitEvent: false },
    );
    control.markAsUntouched();
    this.configureColoradoFactValidators();
    this.form.updateValueAndValidity({ emitEvent: false });
    this.emitFormState();
  }
  readonly form = this.fb.nonNullable.group({
    coloradoPropertyFacts: getStateListingFormFactory('coloradoPropertyFacts')(this.fb),
    coloradoAssumableLoan: getStateListingFormFactory('coloradoAssumableLoan')(this.fb),
    propertyType: [
      '' as PropertyType | '',
      Validators.required,
    ],
    bedrooms: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(99),
      ],
    ],
    bathrooms: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0),
        Validators.max(99),
      ],
    ],
    squareFeet: [
      null as number | null,
      [
        Validators.required,
        Validators.min(1),
        Validators.max(1000000),
      ],
    ],
    yearBuilt: [
      null as number | null,
      [
        Validators.required,
        Validators.min(1600),
        Validators.max(
          new Date().getFullYear() + 1,
        ),
      ],
    ],
    lotSize: [
      null as number | null,
      Validators.min(0),
    ],
    lotSizeUnit: [
      'square_feet' as LotSizeUnit,
      Validators.required,
    ],
    lotNumber: [
      '',
      Validators.maxLength(200),
    ],
    blockNumber: [
      '',
      Validators.maxLength(200),
    ],
    subdivisionName: [
      '',
      Validators.maxLength(500),
    ],
    legalDescription: [
      '',
      Validators.maxLength(5000),
    ],
    description: [
      '',
      [
        Validators.required,
        Validators.minLength(20),
        Validators.maxLength(5000),
      ],
    ],
    hoa: this.fb.nonNullable.group({
      hasHoa: [
        null as boolean | null,
      ],
      feeAmount: [
        null as number | null,
        [
          Validators.min(0),
          Validators.max(1000000),
        ],
      ],
      feeFrequency: [
        '' as ListingHoaFeeFrequency | '',
      ],
      associationName: [''],
      managementCompany: [''],
      contactPhone: [''],
    }),
    sellerStatements:
      this.fb.nonNullable.group({
        southCarolina: getStateListingFormFactory('sellerStatements.southCarolina')(this.fb),
        california: getStateListingFormFactory('sellerStatements.california')(this.fb),
        ownershipStatus: [
          '' as
          | PropertyDetailsSellerOwnershipStatus
          | '',
        ],
        leadBasedPaintApplies: [
          null as boolean | null,
        ],
        methamphetamineContaminationKnown: [
          null as boolean | null,
        ],
        ownersAssociationApplies: [
          null as boolean | null,
        ],
        fuelTankPresent: [
          null as boolean | null,
        ],
        fuelTankOwnership: [
          '' as
          | PropertyDetailsFuelTankOwnership
          | '',
        ],
        leasesExist: [
          null as boolean | null,
        ],
        residentialLeasesExist: [
          null as boolean | null,
        ],
        fixtureLeasesExist: [
          null as boolean | null,
        ],
        naturalResourceLeasesExist: [
          null as boolean | null,
        ],
        additionalSellerIncluded: [
          false,
        ],
        additionalSellerLegalName: [''],
        additionalSellerEmail: [''],
        additionalSellerPhone: [''],
      }),
  });
  constructor() {
    effect(() => {
      const initialValue =
        this.initialValue();
      if (initialValue) {
        this.form.patchValue(
          {
            ...initialValue,
            coloradoPropertyFacts: getStateListingFormRestorer('coloradoPropertyFacts')(initialValue.coloradoPropertyFacts),
            coloradoAssumableLoan: initialValue.coloradoAssumableLoan ?? undefined,
            hoa:
              initialValue.hoa ?? {
                hasHoa: null,
                associationName: '',
                managementCompany: '',
                contactPhone: '',
                feeAmount: null,
                feeFrequency: '',
              },
            sellerStatements:
              initialValue.sellerStatements ?? {
                ownershipStatus: '',
                leadBasedPaintApplies: null,
                ownersAssociationApplies:
                  null,
                fuelTankPresent: null,
                fuelTankOwnership: '',
                leasesExist: null,
                residentialLeasesExist:
                  null,
                fixtureLeasesExist: null,
                naturalResourceLeasesExist:
                  null,
                additionalSellerIncluded:
                  false,
                additionalSellerLegalName:
                  '',
                additionalSellerEmail: '',
                additionalSellerPhone: '',
              },
          },
          {
            emitEvent: false,
          },
        );
      }
      this.form.controls.sellerStatements.controls.southCarolina.patchValue(
        getStateListingFormRestorer('sellerStatements.southCarolina')(initialValue?.sellerStatements?.southCarolina),
        { emitEvent: false },
      );
      this.configureStateQuestionValidators();
      this.form.controls.sellerStatements.controls.california.patchValue(
        getStateListingFormRestorer('sellerStatements.california')(initialValue?.sellerStatements?.california),
        { emitEvent: false },
      );
      this.configureHoaValidators(
        this.form.controls.hoa.controls
          .hasHoa.value,
        false,
      );
      this.configureColoradoFactValidators();
      this.configureColoradoLoanValidators();
      this.configureStateStatementValidators();
      this.configureLegalDescriptionValidators();
      this.configureFuelTankValidators(
        this.form.controls.sellerStatements
          .controls.fuelTankPresent.value,
        false,
      );
      this.configureLeaseValidators();
      this.configureAdditionalSellerValidators(
        this.form.controls.sellerStatements
          .controls.additionalSellerIncluded
          .value,
        false,
      );
      this.validityChange.emit(
        this.form.valid,
      );
    });
    this.form.controls.hoa.controls.hasHoa.valueChanges.subscribe(
      hasHoa => {
        this.configureHoaValidators(
          hasHoa,
          true,
        );
        if (hasHoa !== null) {
          this.form.controls.sellerStatements.controls.ownersAssociationApplies.setValue(
            hasHoa,
            {
              emitEvent: false,
            },
          );
        }
        this.emitFormState();
      },
    );
    this.form.controls.sellerStatements.controls.ownersAssociationApplies.valueChanges.subscribe(
      ownersAssociationApplies => {
        if (
          ownersAssociationApplies !== null
        ) {
          this.form.controls.hoa.controls.hasHoa.setValue(
            ownersAssociationApplies,
            {
              emitEvent: false,
            },
          );
          this.configureHoaValidators(
            ownersAssociationApplies,
            ownersAssociationApplies ===
            false,
          );
        }
        this.emitFormState();
      },
    );
    this.form.controls.sellerStatements.controls.fuelTankPresent.valueChanges.subscribe(
      fuelTankPresent => {
        this.configureFuelTankValidators(
          fuelTankPresent,
          true,
        );
        this.emitFormState();
      },
    );
    this.form.controls.sellerStatements.controls.additionalSellerIncluded.valueChanges.subscribe(
      included => {
        this.configureAdditionalSellerValidators(
          included,
          true,
        );
        this.emitFormState();
      },
    );
    this.form.valueChanges.subscribe(() => {
      this.configureColoradoFactValidators();
      this.emitFormState();
    });
    this.form.controls.coloradoAssumableLoan.controls.available.valueChanges.subscribe(() => {
      this.configureColoradoLoanValidators();
      this.emitFormState();
    });
  }
  ngOnInit(): void {
    if (this.isTexasListing()) {
      void this.loadLeaseDocuments();
    }
  }
  private configureColoradoFactValidators(): void {
    getStateListingFormValidator('coloradoPropertyFacts')(
      this.form.controls.coloradoPropertyFacts,
      this.isColoradoListing(),
      key => this.coloradoFactChoice(key),
    );
  }
  private configureColoradoLoanValidators(): void {
    getStateListingFormValidator('coloradoAssumableLoan')(
      this.form.controls.coloradoAssumableLoan,
      this.isColoradoListing(),
    );
  }
  protected leaseDocumentFor(
    documentType: TexasLeaseDocumentType,
  ): ListingDisclosureDocument | null {
    return (
      this.leaseDocuments()[documentType] ??
      null
    );
  }
  protected selectedLeaseFileFor(
    documentType: TexasLeaseDocumentType,
  ): File | null {
    return (
      this.selectedLeaseFiles()[
      documentType
      ] ?? null
    );
  }
  protected onLeaseFileSelected(
    event: Event,
    documentType: TexasLeaseDocumentType,
  ): void {
    const inputElement =
      event.target as HTMLInputElement;
    const file =
      inputElement.files?.[0];
    this.leaseDocumentError.set('');
    this.leaseDocumentMessage.set('');
    if (!file) {
      this.removeSelectedLeaseFile(
        documentType,
      );
      return;
    }
    if (
      file.type !== 'application/pdf'
    ) {
      inputElement.value = '';
      this.removeSelectedLeaseFile(
        documentType,
      );
      this.leaseDocumentError.set(
        'Lease documents must be PDF files.',
      );
      return;
    }
    if (
      file.size >
      15 * 1024 * 1024
    ) {
      inputElement.value = '';
      this.removeSelectedLeaseFile(
        documentType,
      );
      this.leaseDocumentError.set(
        'A lease PDF cannot exceed 15 MB.',
      );
      return;
    }
    this.selectedLeaseFiles.update(
      current => ({
        ...current,
        [documentType]: file,
      }),
    );
  }
  protected async uploadLeaseDocument(
    documentType: TexasLeaseDocumentType,
  ): Promise<void> {
    const listingUid =
      this.listingUid();
    const sellerUid =
      auth.currentUser?.uid;
    const file =
      this.selectedLeaseFileFor(
        documentType,
      );
    if (
      !listingUid ||
      !sellerUid ||
      !file ||
      this.uploadingLeaseType()
    ) {
      return;
    }
    this.leaseDocumentError.set('');
    this.leaseDocumentMessage.set('');
    this.uploadingLeaseType.set(
      documentType,
    );
    try {
      const uploadedDocument =
        await this.disclosureService.uploadDisclosure(
          sellerUid,
          listingUid,
          'TX',
          documentType,
          file,
        );
      this.leaseDocuments.update(
        current => ({
          ...current,
          [documentType]:
            uploadedDocument,
        }),
      );
      this.removeSelectedLeaseFile(
        documentType,
      );
      this.leaseDocumentMessage.set(
        'Lease document uploaded successfully.',
      );
    } catch (error: unknown) {
      this.leaseDocumentError.set(
        error instanceof Error
          ? error.message
          : 'The lease document could not be uploaded.',
      );
    } finally {
      this.uploadingLeaseType.set(
        null,
      );
    }
  }
  protected async openLeaseDocument(
    document: ListingDisclosureDocument,
  ): Promise<void> {
    this.leaseDocumentError.set('');
    try {
      await this.disclosureService.openDisclosure(
        document,
      );
    } catch (error: unknown) {
      this.leaseDocumentError.set(
        error instanceof Error
          ? error.message
          : 'The lease document could not be opened.',
      );
    }
  }
  private async loadLeaseDocuments():
    Promise<void> {
    const listingUid =
      this.listingUid();
    if (!listingUid) {
      return;
    }
    try {
      const summaries =
        await this.disclosureService.getListingDisclosures(
          listingUid,
        );
      const leaseTypes =
        new Set<TexasLeaseDocumentType>([
          'texas-residential-leases',
          'texas-fixture-leases',
          'texas-natural-resource-leases',
        ]);
      const documents: Partial<
        Record<
          TexasLeaseDocumentType,
          ListingDisclosureDocument
        >
      > = {};
      for (const summary of summaries) {
        const documentType =
          summary.documentType as TexasLeaseDocumentType;
        if (
          leaseTypes.has(documentType)
        ) {
          documents[documentType] =
            summary.currentDocument;
        }
      }
      this.leaseDocuments.set(
        documents,
      );
    } catch (error: unknown) {
      this.leaseDocumentError.set(
        error instanceof Error
          ? error.message
          : 'Existing lease documents could not be loaded.',
      );
    }
  }
  private removeSelectedLeaseFile(
    documentType: TexasLeaseDocumentType,
  ): void {
    this.selectedLeaseFiles.update(
      current => {
        const next = {
          ...current,
        };
        delete next[documentType];
        return next;
      },
    );
  }
  private configureHoaValidators(
    hasHoa: boolean | null,
    clearValues: boolean,
  ): void {
    const controls =
      this.form.controls.hoa.controls;
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
        controls.feeAmount.setValue(
          null,
          {
            emitEvent: false,
          },
        );
        controls.feeFrequency.setValue(
          '',
          {
            emitEvent: false,
          },
        );
        controls.associationName.setValue(
          '',
          {
            emitEvent: false,
          },
        );
        controls.managementCompany.setValue(
          '',
          {
            emitEvent: false,
          },
        );
        controls.contactPhone.setValue(
          '',
          {
            emitEvent: false,
          },
        );
      }
    }
    controls.feeAmount.updateValueAndValidity({
      emitEvent: false,
    });
    controls.feeFrequency.updateValueAndValidity({
      emitEvent: false,
    });
    controls.associationName.updateValueAndValidity({
      emitEvent: false,
    });
    controls.managementCompany.updateValueAndValidity({
      emitEvent: false,
    });
  }
  private configureFuelTankValidators(
    fuelTankPresent: boolean | null,
    clearValue: boolean,
  ): void {
    const fuelTankOwnership =
      this.form.controls.sellerStatements
        .controls.fuelTankOwnership;
    if (fuelTankPresent === true) {
      fuelTankOwnership.setValidators([
        Validators.required,
      ]);
    } else {
      fuelTankOwnership.clearValidators();
      if (clearValue) {
        fuelTankOwnership.setValue(
          '',
          {
            emitEvent: false,
          },
        );
      }
    }
    fuelTankOwnership.updateValueAndValidity({
      emitEvent: false,
    });
  }
  private configureLegalDescriptionValidators(): void {
    const control = this.form.controls.legalDescription;
    control.setValidators([
      Validators.maxLength(5000),
    ]);
    control.updateValueAndValidity({
      emitEvent: false,
    });
  }
  private configureLeaseValidators(): void {
    configureListingLeaseValidators(
      this.form.controls.sellerStatements.controls,
      this.stateListingPackage(),
    );
  }
  private configureStateStatementValidators(): void {
    configureListingStatementValidators(
      this.form.controls.sellerStatements.controls,
      this.stateListingPackage(),
    );
  }
  private configureAdditionalSellerValidators(
    included: boolean,
    clearValues: boolean,
  ): void {
    const controls =
      this.form.controls.sellerStatements
        .controls;
    const fields = [
      controls.additionalSellerLegalName,
      controls.additionalSellerEmail,
      controls.additionalSellerPhone,
    ];
    if (included) {
      controls.additionalSellerLegalName.setValidators(
        [
          Validators.required,
          Validators.maxLength(300),
        ],
      );
      controls.additionalSellerEmail.setValidators(
        [
          Validators.required,
          Validators.email,
          Validators.maxLength(320),
        ],
      );
      controls.additionalSellerPhone.setValidators(
        [
          Validators.required,
          Validators.maxLength(50),
        ],
      );
    } else {
      fields.forEach(control => {
        control.clearValidators();
      });
      if (clearValues) {
        fields.forEach(control => {
          control.setValue('', {
            emitEvent: false,
          });
        });
      }
    }
    fields.forEach(control => {
      control.updateValueAndValidity({
        emitEvent: false,
      });
    });
  }
  private emitFormState(): void {
    this.valueChange.emit(
      this.form.getRawValue() as PropertyDetailsFormValue,
    );
    this.validityChange.emit(
      this.form.valid,
    );
  }
  protected stateQuestionControl(fieldPath: string): FormControl<boolean | null> {
    const control = this.form.get(fieldPath);
    if (!(control instanceof FormControl)) {
      throw new Error(`The state listing question control is missing: ${fieldPath}`);
    }
    return control as FormControl<boolean | null>;
  }

  private configureStateQuestionValidators(): void {
    const activePaths = new Set(
      (this.stateListingPackage().questionGroups ?? []).flatMap(group =>
        group.questions.filter(question => question.required).map(question => question.fieldPath))
    );
    for (const group of getStateListingQuestionGroups()) {
      for (const question of group.questions) {
        const control = this.stateQuestionControl(question.fieldPath);
        control.setValidators(activePaths.has(question.fieldPath) ? [Validators.required] : []);
        control.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

}
