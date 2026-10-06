/*property-details-step.component.ts*/
import { CALIFORNIA_LISTING_FACT_DEFAULTS, type CaliforniaListingFacts } from '../../../../../core/domains/listings/state-packages/california/california-listing-facts.model';
import { COLORADO_FACT_DEFAULTS, type ColoradoPropertyFacts } from '../../../../../core/domains/offers/state-contracts/colorado/models/colorado-contract-elections';
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
  AbstractControl,
  FormBuilder,
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
import type { ColoradoSellerLoan } from '../../../../../core/domains/offers/state-contracts/colorado/models/colorado-offer-terms.model';
import { getStateListingPackage } from '../../../../../core/domains/listings/state-packages/state-listing.registry';
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
export interface ColoradoSellerLoanFormValue extends Omit<ColoradoSellerLoan,
  'estimatedBalanceInCents' | 'principalInterestPaymentInCents'> {
  estimatedBalanceDollars: number;
  principalInterestPaymentDollars: number;
}
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
      ['WI', 'FL', 'LA', 'CA', 'SC'].includes(
        this.stateCode().trim().toUpperCase(),
      ),
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
      value: 'condo',
      label: 'Condo',
    },
    {
      value: 'land',
      label: 'Land',
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
      value: 'pud',
      label: 'Pud',
    },
    {
      value: 'single_family',
      label: 'Single Family',
    },
    {
      value: 'townhome',
      label: 'Townhome',
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
  readonly coloradoOptionalFacts = [
    {
      key: 'leasedItems',
      question: 'Is any equipment included in the sale leased?',
      detail: 'Leased equipment and lease references',
      guidance:
        'Examples include rented propane tanks, security systems or equipment. Identify the equipment and lease document.',
    },
    {
      key: 'encumberedItems',
      question:
        'Is any included equipment subject to debt or a PACE obligation?',
      detail: 'Equipment debt or PACE obligation',
      guidance:
        'Identify the equipment, outstanding obligation and relevant agreement.',
    },
    {
      key: 'solarPowerPlan',
      question: 'Is there a solar lease or power purchase agreement?',
      detail: 'Solar agreement and document reference',
      guidance:
        'Identify the provider, agreement and relevant document. Seller-owned solar equipment belongs in the included-items description.',
    },
    {
      key: 'deededWaterRights',
      question:
        'Are separately deeded water rights included with this property?',
      detail: 'Deeded water rights and their legal description',
      guidance:
        'Describe the separately deeded water rights and copy their legal description from your records. This is separate from the property legal description. Municipal water service alone does not establish separately deeded water rights.',
    },
    {
      key: 'otherWaterRights',
      question: 'Are other transferable water rights included?',
      detail: 'Other transferable water rights',
      guidance:
        'Identify the rights and supporting documents. Do not assume water utility service is a transferable water right.',
    },
    {
      key: 'wellPermit',
      question: 'Does the property use a well?',
      detail: 'Well and permit information',
      guidance:
        'Enter the permit number and identify any available permit copy. If a well exists but the permit number is unknown, state that in the details.',
    },
    {
      key: 'waterStock',
      question: 'Are water company shares included in the sale?',
      detail: 'Water company and shares',
      guidance:
        'Identify the water company, shares and supporting ownership records.',
    },
    {
      key: 'mineralRights',
      question:
        'Do your records identify mineral interests or reservations affecting the property?',
      detail: 'Known mineral interests and reservations',
      guidance:
        'Describe what your deed or other records identify. NO means no known interests or reservations are reported; it does not establish ownership or guarantee clear title.',
    },
    {
      key: 'offRecordMatters',
      question:
        'Are there known off-record title matters or existing surveys to identify?',
      detail: 'Known off-record matters and surveys',
      guidance:
        'Identify known unrecorded claims, use agreements or existing survey documents. This answer is not a title guarantee.',
    },
    {
      key: 'thirdPartyRights',
      question:
        'Does another party have an approval right, purchase option or right of first refusal?',
      detail: 'Third-party approval or purchase rights',
      guidance:
        'Identify the party, right and relevant agreement or document.',
    },
    {
      key: 'leases',
      question: 'Are there existing occupancy agreements or leases?',
      detail: 'Occupancy agreements and lease references',
      guidance:
        'Identify current rental, occupancy or lease agreements and their documents. Keep this answer consistent with Existing Leases below.',
    },
  ] as const;
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
    coloradoPropertyFacts: this.fb.nonNullable.group({
      includedItems: [''],
      excludedItems: [''],
      leasedItems: [''],
      encumberedItems: [''],
      solarPowerPlan: [''],
      parkingStorage: [''],
      waterSource: [''],
      deededWaterRights: [''],
      otherWaterRights: [''],
      wellPermit: [''],
      waterStock: [''],
      mineralRights: [''],
      offRecordMatters: [''],
      thirdPartyRights: [''],
      leases: [''],
      metroDistrictWebsite: [''],
      metroDistrictDisclosure: [''],
      metroDistrict: ['unselected' as ColoradoPropertyFacts['metroDistrict']],
    }),
    coloradoAssumableLoan: this.fb.nonNullable.group({
      available: [false], ratePercent: [0],
      estimatedBalanceDollars: [0], balanceAsOf: [''],
      principalInterestPaymentDollars: [0], paymentPeriod: ['month'],
      escrowRealEstateTaxes: [false], escrowPropertyInsurance: [false],
      escrowMortgageInsurance: [false], escrowOther: [''],
    }),
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
        southCarolina: this.fb.nonNullable.group({
          beachfrontApplies: [null as boolean | null],
          futureVacationBookingsExist: [null as boolean | null],
        }),
        california: this.fb.nonNullable.group({
          transferDisclosure: ['unselected'], transferExemptionBasis: [''],
          naturalHazardDisclosure: ['unselected'], naturalHazardExemptionBasis: [''],
          fireHazardZone: ['unselected'], resaleWithin18Months: ['unselected'],
          assistedWaterTank: ['unselected'], gasApplianceRestrictions: [''],
        }),
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
            coloradoPropertyFacts: { ...COLORADO_FACT_DEFAULTS, ...initialValue.coloradoPropertyFacts },
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
      this.form.controls.sellerStatements.controls.southCarolina.patchValue({
        beachfrontApplies: initialValue?.sellerStatements?.southCarolina?.beachfrontApplies ?? null,
        futureVacationBookingsExist: initialValue?.sellerStatements?.southCarolina?.futureVacationBookingsExist ?? null,
      }, { emitEvent: false });
      this.configureSouthCarolinaValidators();
      this.form.controls.sellerStatements.controls.california.patchValue(
        { ...CALIFORNIA_LISTING_FACT_DEFAULTS, ...initialValue?.sellerStatements?.california },
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
      this.configureLeaseValidators(
        this.isTexasListing(),
      );
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
    const group = this.form.controls.coloradoPropertyFacts;
    const c = group.controls;
    const active = this.isColoradoListing();
    const requiredText = (control: AbstractControl) =>
      typeof control.value === 'string' && control.value.trim()
        ? null
        : { required: true };
    // Errors belong to individual controls, not the whole section.
    group.clearValidators();
    for (const control of Object.values(c)) {
      control.setValidators(Validators.maxLength(4000));
    }
    c.waterSource.setValidators(
      active
        ? [requiredText, Validators.maxLength(4000)]
        : [],
    );
    c.metroDistrict.setValidators(
      active
        ? [
          (control: AbstractControl) =>
            ['covered', 'not_applicable'].includes(control.value)
              ? null
              : control.value === 'unknown'
                ? { districtUnknown: true }
                : { required: true },
        ]
        : [],
    );
    const covered =
      active && c.metroDistrict.value === 'covered';
    c.metroDistrictWebsite.setValidators(
      covered
        ? [
          requiredText,
          (control: AbstractControl) => {
            if (!control.value?.trim()) {
              return null;
            }
            try {
              const url = new URL(control.value.trim());
              return url.protocol === 'https:' &&
                url.hostname.includes('.')
                ? null
                : { districtUrl: true };
            } catch {
              return { districtUrl: true };
            }
          },
          Validators.maxLength(4000),
        ]
        : [],
    );
    c.metroDistrictDisclosure.setValidators(
      covered
        ? [requiredText, Validators.maxLength(4000)]
        : [],
    );
    for (const field of this.coloradoOptionalFacts) {
      c[field.key].setValidators(
        active && this.coloradoFactChoice(field.key) === 'yes'
          ? [requiredText, Validators.maxLength(4000)]
          : [Validators.maxLength(4000)],
      );
    }
    for (const control of Object.values(c)) {
      control.updateValueAndValidity({ emitEvent: false });
    }
    group.updateValueAndValidity({ emitEvent: false });
  }
  private configureColoradoLoanValidators(): void {
    const controls = this.form.controls.coloradoAssumableLoan.controls;
    const active = this.isColoradoListing() && controls.available.value;
    const required = active ? [Validators.required] : [];
    controls.balanceAsOf.setValidators(required);
    controls.paymentPeriod.setValidators(required);
    controls.ratePercent.setValidators(active ? [Validators.min(0.01), Validators.max(30)] : []);
    controls.estimatedBalanceDollars.setValidators(active ? [Validators.min(1)] : []);
    controls.principalInterestPaymentDollars.setValidators(active ? [Validators.min(1)] : []);
    controls.escrowOther.setValidators(active ? [Validators.maxLength(180)] : []);
    for (const control of Object.values(controls)) control.updateValueAndValidity({ emitEvent: false });
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
  private configureLeaseValidators(
    isTexasListing: boolean,
  ): void {
    const controls =
      this.form.controls.sellerStatements
        .controls;
    const texasLeaseControls = [
      controls.residentialLeasesExist,
      controls.fixtureLeasesExist,
      controls.naturalResourceLeasesExist,
    ];
    if (isTexasListing) {
      controls.leasesExist.clearValidators();
      texasLeaseControls.forEach(
        control => {
          control.setValidators([
            Validators.required,
          ]);
        },
      );
    } else if (
      this.requiresGeneralLeases()
    ) {
      controls.leasesExist.setValidators([
        Validators.required,
      ]);
      texasLeaseControls.forEach(
        control => {
          control.clearValidators();
        },
      );
    } else {
      controls.leasesExist.clearValidators();
      texasLeaseControls.forEach(
        control => {
          control.clearValidators();
        },
      );
    }
    controls.leasesExist.updateValueAndValidity({
      emitEvent: false,
    });
    texasLeaseControls.forEach(
      control => {
        control.updateValueAndValidity({
          emitEvent: false,
        });
      },
    );
  }
  private configureStateStatementValidators():
    void {
    const controls =
      this.form.controls.sellerStatements
        .controls;
    this.setRequired(
      controls.ownershipStatus,
      this.requiresOwnershipStatus(),
    );
    this.setRequired(
      controls.leadBasedPaintApplies,
      this.requiresLeadBasedPaint(),
    );
    this.setRequired(
      controls.methamphetamineContaminationKnown,
      this.requiresUtahMethamphetamineStatement(),
    );
    this.setRequired(
      controls.ownersAssociationApplies,
      requiresStateListingField(
        this.stateListingPackage(),
        'ownersAssociationApplies',
      ),
    );
    this.setRequired(
      controls.fuelTankPresent,
      this.requiresFuelTank(),
    );
  }
  private setRequired(
    control: AbstractControl,
    required: boolean,
  ): void {
    if (required) {
      control.setValidators([
        Validators.required,
      ]);
    } else {
      control.clearValidators();
    }
    control.updateValueAndValidity({
      emitEvent: false,
    });
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
  protected isSouthCarolinaListing(): boolean {
    const state = this.stateCode().trim().toUpperCase();
    return state === 'SC' || state === 'SOUTH CAROLINA';
  }
  private configureSouthCarolinaValidators(): void {
    const controls = this.form.controls.sellerStatements.controls.southCarolina.controls;
    for (const control of [controls.beachfrontApplies, controls.futureVacationBookingsExist]) {
      if (this.isSouthCarolinaListing()) {
        control.setValidators([Validators.required]);
      } else {
        control.clearValidators();
      }
      control.updateValueAndValidity({ emitEvent: false });
    }
  }

}
