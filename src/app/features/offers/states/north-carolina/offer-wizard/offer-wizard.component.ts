import { createNorthCarolinaOfferTerms, createExpirationIso, toCents, optionalCents, optionalNumber, optionalInteger, optionalText } from './north-carolina-offer-wizard.mapping';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  input,
} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import {
  debounceTime,
} from 'rxjs';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  AdditionalTermsSectionComponent,
} from '../../north-carolina/components/additional-terms-section/additional-terms-section.component';

import {
  BuyerPropertySectionComponent,
} from '../../north-carolina/components/buyer-property-section/buyer-property-section.component';

import {
  ConcessionsSectionComponent,
} from '../../north-carolina/components/concessions-section/concessions-section.component';

import {
  DepositsDueDiligenceSectionComponent,
} from '../../north-carolina/components/deposits-due-diligence-section/deposits-due-diligence-section.component';

import {
  DisclosuresAddendaSectionComponent,
} from '../../north-carolina/components/disclosures-addenda-section/disclosures-addenda-section.component';

import {
  OfferExpirationSectionComponent,
} from '../../north-carolina/components/offer-expiration-section/offer-expiration-section.component';

import {
  OfferReviewSectionComponent,
} from '../../north-carolina/components/offer-review-section/offer-review-section.component';

import {
  PriceFinancingSectionComponent,
} from '../../north-carolina/components/price-financing-section/price-financing-section.component';

import {
  PropertyInclusionsSectionComponent,
} from '../../north-carolina/components/property-inclusions-section/property-inclusions-section.component';

import {
  SettlementPossessionSectionComponent,
} from '../../north-carolina/components/settlement-possession-section/settlement-possession-section.component';

import {
  AccountState,
} from '../../../../../core/authentication/state/account.state';

import {
  OfferTerms,
} from '../../../../../core/domains/offers/models/offer-terms.model';

import {
  OfferVersionDraftChanges,
  OfferVersion,
  OfferVersionPartySnapshot,
} from '../../../../../core/domains/offers/models/offer-version.model';

export interface NorthCarolinaOfferSession {
  readonly listingUid: string;
  readonly offerUid: string;
  readonly offerVersionUid: string;
  readonly offerVersion: OfferVersion;
  readonly profile:
    NonNullable<ReturnType<AccountState['profile']>>;
  readonly propertyCounty: string;
  readonly saveDraft:
    (changes: OfferVersionDraftChanges<OfferTerms>) =>
      Promise<void>;
  readonly submitOffer: () => Promise<void>;
  readonly returnToListing: () => Promise<void>;
}

export interface OfferWizardSection {
  key: string;
  title: string;
  shortTitle: string;
  description: string;
}

@Component({
  selector: 'app-offer-wizard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AdditionalTermsSectionComponent,
    BuyerPropertySectionComponent,
    ConcessionsSectionComponent,
    DepositsDueDiligenceSectionComponent,
    DisclosuresAddendaSectionComponent,
    OfferExpirationSectionComponent,
    OfferReviewSectionComponent,
    PriceFinancingSectionComponent,
    PropertyInclusionsSectionComponent,
    SettlementPossessionSectionComponent,
  ],
  templateUrl: './offer-wizard.component.html',
  styleUrl: './offer-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferWizardComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);

  private readonly destroyRef = inject(DestroyRef);

  offerUid = '';

  offerVersionUid = '';

  private existingTerms: OfferTerms | null = null;

  private primaryBuyer:
    OfferVersionPartySnapshot | null = null;

  private coBuyerUid = '';

  readonly coBuyerLocked = signal(false);

  readonly canAddCoBuyer = signal(false);

  private offerVersionNumber = 1;

  private saveChain: Promise<void> = Promise.resolve();

  readonly session =
    input.required<NorthCarolinaOfferSession>();

  get listingUid(): string {
    return this.session().listingUid;
  }

  readonly currentSectionIndex = signal(0);

  readonly saving = signal(false);

  readonly submitting = signal(false);

  readonly loading = signal(true);

  readonly errorMessage = signal('');

  readonly saveMessage = signal('');

  readonly validationAttemptedSection =
    signal<string | null>(null);

  readonly sections: readonly OfferWizardSection[] = [
    {
      key: 'buyerProperty',
      title: 'Buyer and Property',
      shortTitle: 'Buyer',
      description:
        'Confirm the buyer, seller and property information pulled from NavStreet.',
    },
    {
      key: 'priceFinancing',
      title: 'Purchase Price and Funding',
      shortTitle: 'Price',
      description:
        'Enter the proposed purchase price and indicate whether the purchase will use cash or a loan.',
    },
    {
      key: 'depositsDueDiligence',
      title: 'Deposit and Due Diligence',
      shortTitle: 'Deposit',
      description:
        'Enter the Deposit, escrow agent and proposed due-diligence deadline.',
    },
    {
      key: 'concessions',
      title: 'Seller Concessions',
      shortTitle: 'Concessions',
      description:
        'Enter any seller concession and home-warranty amount requested by the buyer.',
    },
    {
      key: 'propertyInclusions',
      title: 'Property Inclusions and Exclusions',
      shortTitle: 'Property',
      description:
        'Identify included, excluded, leased and separately included property.',
    },
    {
      key: 'settlementPossession',
      title: 'Settlement and Possession',
      shortTitle: 'Settlement',
      description:
        'Enter the proposed settlement date and when possession will be delivered.',
    },
    {
      key: 'disclosuresAddenda',
      title: 'Buyer Disclosure Acknowledgements',
      shortTitle: 'Disclosures',
      description:
        'Record the buyer’s selections for the required North Carolina disclosure statements.',
    },
    {
      key: 'additionalTerms',
      title: 'Additional Terms Exhibit',
      shortTitle: 'Terms',
      description:
        'Attach separately prepared additional terms when they are part of the offer.',
    },
    {
      key: 'offerExpiration',
      title: 'Offer Expiration',
      shortTitle: 'Expiration',
      description:
        'Specify when the offer expires if it has not been accepted.',
    },
    {
      key: 'offerReview',
      title: 'Review and Certification',
      shortTitle: 'Review',
      description:
        'Review the offer and accept the required electronic records and platform acknowledgements.',
    },
  ];

  readonly currentSection = computed(
    () => this.sections[this.currentSectionIndex()],
  );

  readonly isFirstSection = computed(
    () => this.currentSectionIndex() === 0,
  );

  readonly isLastSection = computed(
    () =>
      this.currentSectionIndex() ===
      this.sections.length - 1,
  );

  readonly progressPercentage = computed(
    () =>
      (
        (this.currentSectionIndex() + 1) /
        this.sections.length
      ) * 100,
  );

  readonly offerForm = this.formBuilder.group({
    buyerProperty: this.formBuilder.group({
      coBuyerEnabled: [false],
      coBuyerLegalName: [
        { value: '', disabled: true },
        Validators.required,
      ],
      coBuyerEmail: [
        { value: '', disabled: true },
        [
          Validators.required,
          Validators.email,
        ],
      ],
      coBuyerPhone: [
        { value: '', disabled: true },
        [
          Validators.required,
          Validators.pattern(/^\+?[0-9() .-]{7,20}$/),
        ],
      ],
      buyerFirstName: [
        { value: '', disabled: true },
      ],
      buyerMiddleName: [
        { value: '', disabled: true },
      ],
      buyerLastName: [
        { value: '', disabled: true },
      ],
      buyerSuffix: [
        { value: '', disabled: true },
      ],
      buyerEmail: [
        { value: '', disabled: true },
      ],
      buyerPhone: [
        { value: '', disabled: true },
      ],
      sellerLegalName: [
        { value: '', disabled: true },
      ],
      sellerEmail: [
        { value: '', disabled: true },
      ],
      propertyAddress: [
        { value: '', disabled: true },
      ],
      propertyCity: [
        { value: '', disabled: true },
      ],
      propertyCounty: [
        { value: '', disabled: true },
      ],
      propertyState: [
        { value: 'NC', disabled: true },
      ],
      propertyPostalCode: [
        { value: '', disabled: true },
      ],
      propertyParcelId: [
        { value: '', disabled: true },
      ],
      propertyDeedBook: [
        { value: '', disabled: true },
      ],
      propertyDeedPage: [
        { value: '', disabled: true },
      ],
      propertyOtherReference: [
        { value: '', disabled: true },
      ],
    }),

    priceFinancing: this.formBuilder.group(
      {
        purchasePrice: [
          null as number | null,
          [
            Validators.required,
            Validators.min(1),
          ],
        ],
        financingMethod: [
          '',
          [
            Validators.required,
            Validators.pattern(/^(cash|loan)$/),
          ],
        ],
        otherPropertyWillFundPurchase: [false],
        otherPropertyDescription: [
          '',
          [
            Validators.maxLength(500),
          ],
        ],
      },
      {
        validators: [
          priceFundingValidator,
        ],
      },
    ),

    depositsDueDiligence: this.formBuilder.group(
      {
        depositAmount: [
          null as number | null,
          [
            Validators.required,
            Validators.min(0),
          ],
        ],
        depositDeliveryDays: [
          4,
          [
            Validators.required,
            Validators.min(1),
            Validators.max(30),
            Validators.pattern(/^[1-9]\d*$/),
          ],
        ],
        escrowAgentName: [
          '',
          [
            Validators.maxLength(200),
          ],
        ],
        dueDiligenceDeadlineType: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^(specific_date|days_after_effective_date)$/,
            ),
          ],
        ],
        dueDiligenceEndDate: [''],
        dueDiligenceDaysAfterEffectiveDate: [
          null as number | null,
          [
            Validators.min(1),
            Validators.max(365),
          ],
        ],
        dueDiligenceEndTime: [
          { value: '17:00', disabled: true },
        ],
      },
      {
        validators: [
          dueDiligenceValidator,
        ],
      },
    ),

    concessions: this.formBuilder.group(
      {
        concessionType: [
          'none',
          [
            Validators.required,
            Validators.pattern(/^(none|amount|percentage)$/),
          ],
        ],
        sellerConcessionAmount: [
          null as number | null,
          [
            Validators.min(0),
          ],
        ],
        sellerConcessionPercentage: [
          null as number | null,
          [
            Validators.min(0),
            Validators.max(100),
          ],
        ],
        homeWarrantyRequested: [false],
        homeWarrantyAmount: [
          null as number | null,
          [
            Validators.min(0),
          ],
        ],
      },
      {
        validators: [
          concessionsValidator,
        ],
      },
    ),

    propertyInclusions: this.formBuilder.group(
      {
        manufacturedHomeIncluded: [false],
        separatePropertyIncluded: [false],
        separatePropertyDescription: [
          '',
          [
            Validators.maxLength(1500),
          ],
        ],
        includedItemsDescription: [
          '',
          [
            Validators.maxLength(1500),
          ],
        ],
        excludedItemsDescription: [
          '',
          [
            Validators.maxLength(1500),
          ],
        ],
        leasedItemsDescription: [
          '',
          [
            Validators.maxLength(1500),
          ],
        ],
      },
      {
        validators: [
          propertyInclusionsValidator,
        ],
      },
    ),

    settlementPossession: this.formBuilder.group(
      {
        settlementDate: [
          '',
          [
            Validators.required,
          ],
        ],
        possessionTiming: [
          'at_closing',
          [
            Validators.required,
            Validators.pattern(/^(at_closing|other)$/),
          ],
        ],
        possessionAgreementDocumentUid: [''],
      },
      {
        validators: [
          settlementPossessionValidator,
        ],
      },
    ),

    disclosuresAddenda: this.formBuilder.group({
      residentialPropertyStatus: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(received|not_received|exempt)$/),
        ],
      ],
      residentialPropertyDocumentUid: [''],
      residentialPropertyDocumentVersionId: [''],
      residentialPropertyExemptionReason: [
        '',
        [
          Validators.maxLength(500),
        ],
      ],
      residentialPropertyAcknowledged: [
        false,
        [
          Validators.requiredTrue,
        ],
      ],
      mineralOilGasRightsStatus: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(received|not_received|exempt)$/),
        ],
      ],
      mineralOilGasRightsDocumentUid: [''],
      mineralOilGasRightsDocumentVersionId: [''],
      mineralOilGasRightsExemptionReason: [
        '',
        [
          Validators.maxLength(500),
        ],
      ],
      mineralOilGasRightsAcknowledged: [
        false,
        [
          Validators.requiredTrue,
        ],
      ],
    }),

    additionalTerms: this.formBuilder.group(
      {
        hasAdditionalTerms: [false],
        preparedBy: [''],
        documentUid: [''],
      },
      {
        validators: [
          additionalTermsValidator,
        ],
      },
    ),

    offerExpiration: this.formBuilder.group(
      {
        expirationDate: [
          '',
          [
            Validators.required,
          ],
        ],
        expirationTime: [
          '',
          [
            Validators.required,
          ],
        ],
        timeZone: [
          {
            value: 'America/New_York',
            disabled: true,
          },
        ],
      },
      {
        validators: [
          offerExpirationValidator,
        ],
      },
    ),

    offerReview: this.formBuilder.group({
      informationCertified: [
        false,
        [
          Validators.requiredTrue,
        ],
      ],
      electronicRecordsConsent: [
        false,
        [
          Validators.requiredTrue,
        ],
      ],
      electronicSignatureConsent: [
        false,
        [
          Validators.requiredTrue,
        ],
      ],
      navStreetDisclaimerAccepted: [false],
      attorneyLanguageAcknowledged: [false],
    }),
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    this.saveMessage.set('');

    try {
      const {
        profile,
        offerVersion,
        offerUid,
        offerVersionUid,
      } = this.session();

      this.offerUid = offerUid;
      this.offerVersionUid = offerVersionUid;
      this.existingTerms = offerVersion.terms;
      this.offerVersionNumber = offerVersion.versionNumber;

      const buyer = offerVersion.buyers[0];

      this.primaryBuyer = buyer ?? null;

      this.coBuyerUid =
        offerVersion.buyers[1]?.partyUid ??
        crypto.randomUUID();

      this.coBuyerLocked.set(
        offerVersion.buyers.length > 1,
      );

      this.canAddCoBuyer.set(
        offerVersion.initiatedBy === 'buyer' &&
        offerVersion.versionNumber === 1,
      );

      const seller = offerVersion.sellers[0];

      const property = offerVersion.terms.property;

      const propertyAddress = [
        property.addressLine1,
        property.addressLine2,
      ]
        .filter(Boolean)
        .join(', ');

      const expiration = splitExpiration(
        offerVersion.terms.delivery.expiresAt,
      );

      this.offerForm.patchValue(
        {
          buyerProperty: {
            coBuyerEnabled:
              offerVersion.buyers.length > 1,
            coBuyerLegalName:
              offerVersion.buyers[1]?.legalName ?? '',
            coBuyerEmail:
              offerVersion.buyers[1]?.email ?? '',
            coBuyerPhone:
              offerVersion.buyers[1]?.phone ?? '',
            buyerFirstName:
              buyer?.firstName ?? profile.firstName,
            buyerMiddleName:
              buyer?.middleName ?? '',
            buyerLastName:
              buyer?.lastName ?? profile.lastName,
            buyerSuffix:
              buyer?.suffix ?? '',
            buyerEmail:
              buyer?.email ?? profile.email,
            buyerPhone: formatUsPhoneNumber(
              buyer?.phone ?? profile.phone ?? '',
            ),
            sellerLegalName:
              seller?.legalName ?? '',
            sellerEmail:
              seller?.email ?? '',
            propertyAddress,
            propertyCity: property.city,
            propertyCounty:
              property.county ||
              this.session().propertyCounty ||
              'Not provided',
            propertyState: property.state,
            propertyPostalCode: property.zipCode,
            propertyParcelId:
              property.parcelIdentificationNumber ??
              'Not provided',
            propertyDeedBook:
              property.deedBook ?? 'Not provided',
            propertyDeedPage:
              property.deedPage ?? 'Not provided',
            propertyOtherReference:
              property.otherPropertyReference ??
              property.legalDescription ??
              'Not provided',
          },

          priceFinancing: {
            purchasePrice: fromCents(
              offerVersion.terms.purchase.purchasePriceInCents,
            ),
            financingMethod:
              offerVersion.terms.purchase.financingType ===
              'unselected'
                ? ''
                : offerVersion.terms.purchase.financingType,
            otherPropertyWillFundPurchase:
              offerVersion.terms.purchase
                .otherPropertyWillFundPurchase,
            otherPropertyDescription:
              offerVersion.terms.purchase
                .otherPropertyDescription ?? '',
          },

          depositsDueDiligence: {
            depositAmount: fromCents(
              offerVersion.terms.deposits.depositInCents,
            ),
            depositDeliveryDays:
              offerVersion.terms.deposits.depositDeliveryDays,
            escrowAgentName:
              offerVersion.terms.deposits.escrowAgentName,
            dueDiligenceDeadlineType:
              offerVersion.terms.deposits
                .dueDiligenceDeadlineType === 'unselected'
                ? ''
                : offerVersion.terms.deposits
                    .dueDiligenceDeadlineType,
            dueDiligenceEndDate:
              offerVersion.terms.deposits
                .dueDiligenceEndDate ?? '',
            dueDiligenceDaysAfterEffectiveDate:
              offerVersion.terms.deposits
                .dueDiligenceDaysAfterEffectiveDate ?? null,
            dueDiligenceEndTime: '17:00',
          },

          concessions: {
            concessionType:
              offerVersion.terms.concessions.concessionType,
            sellerConcessionAmount: fromOptionalCents(
              offerVersion.terms.concessions
                .sellerConcessionInCents,
            ),
            sellerConcessionPercentage:
              offerVersion.terms.concessions
                .sellerConcessionPercentage ?? null,
            homeWarrantyRequested:
              offerVersion.terms.concessions
                .homeWarrantyRequested,
            homeWarrantyAmount: fromOptionalCents(
              offerVersion.terms.concessions
                .homeWarrantyInCents,
            ),
          },

          propertyInclusions: {
            manufacturedHomeIncluded:
              offerVersion.terms.propertyTerms
                .manufacturedHomeIncluded,
            separatePropertyIncluded:
              offerVersion.terms.propertyTerms
                .separatePropertyIncluded,
            separatePropertyDescription:
              offerVersion.terms.propertyTerms
                .separatePropertyDescription ?? '',
            includedItemsDescription:
              offerVersion.terms.propertyTerms
                .includedItemsDescription ?? '',
            excludedItemsDescription:
              offerVersion.terms.propertyTerms
                .excludedItemsDescription ?? '',
            leasedItemsDescription:
              offerVersion.terms.propertyTerms
                .leasedItemsDescription ?? '',
          },

          settlementPossession: {
            settlementDate:
              offerVersion.terms.settlement.settlementDate,
            possessionTiming:
              offerVersion.terms.settlement.possessionTiming,
            possessionAgreementDocumentUid:
              offerVersion.terms.settlement
                .possessionAgreementDocumentUid ?? '',
          },

          disclosuresAddenda: {
            residentialPropertyStatus:
              disclosureStatusForForm(
                offerVersion.terms.buyerDisclosures
                  .residentialProperty.status,
              ),
            residentialPropertyDocumentUid:
              offerVersion.terms.buyerDisclosures
                .residentialProperty.documentUid ?? '',
            residentialPropertyDocumentVersionId:
              offerVersion.terms.buyerDisclosures
                .residentialProperty.documentVersionId ?? '',
            residentialPropertyExemptionReason:
              offerVersion.terms.buyerDisclosures
                .residentialProperty.exemptionReason ?? '',
            residentialPropertyAcknowledged:
              offerVersion.terms.buyerDisclosures
                .residentialProperty.acknowledged,
            mineralOilGasRightsStatus:
              disclosureStatusForForm(
                offerVersion.terms.buyerDisclosures
                  .mineralOilGasRights.status,
              ),
            mineralOilGasRightsDocumentUid:
              offerVersion.terms.buyerDisclosures
                .mineralOilGasRights.documentUid ?? '',
            mineralOilGasRightsDocumentVersionId:
              offerVersion.terms.buyerDisclosures
                .mineralOilGasRights.documentVersionId ?? '',
            mineralOilGasRightsExemptionReason:
              offerVersion.terms.buyerDisclosures
                .mineralOilGasRights.exemptionReason ?? '',
            mineralOilGasRightsAcknowledged:
              offerVersion.terms.buyerDisclosures
                .mineralOilGasRights.acknowledged,
          },

          additionalTerms: {
            hasAdditionalTerms:
              offerVersion.terms.additionalTermsExhibit.included,
            preparedBy:
              offerVersion.terms.additionalTermsExhibit
                .preparedBy ?? '',
            documentUid:
              offerVersion.terms.additionalTermsExhibit
                .documentUid ?? '',
          },

          offerExpiration: {
            expirationDate: expiration.date,
            expirationTime: expiration.time,
            timeZone: 'America/New_York',
          },

          offerReview: {
            electronicRecordsConsent:
              offerVersion.terms.delivery
                .electronicDeliveryAuthorized,
          },
        },
        {
          emitEvent: false,
        },
      );

      const savedWizardData = offerVersion.wizardData;
      const savedForm = savedWizardData?.['form'];
      const savedSectionIndex =
        savedWizardData?.['currentSectionIndex'];
      const schemaVersion =
        savedWizardData?.['schemaVersion'];

      const hasSavedForm =
        schemaVersion === 2 &&
        savedForm !== null &&
        typeof savedForm === 'object' &&
        !Array.isArray(savedForm) &&
        Object.keys(
          savedForm as Record<string, unknown>,
        ).length > 0;

      if (hasSavedForm) {
        this.offerForm.patchValue(
          savedForm as ReturnType<
            typeof this.offerForm.getRawValue
          >,
          {
            emitEvent: false,
          },
        );
      }

      // The signed party snapshot takes precedence over an old wizard cache.
      if (this.coBuyerLocked()) {
        this.offerForm.controls.buyerProperty.patchValue(
          {
            coBuyerEnabled: true,
            coBuyerLegalName:
              offerVersion.buyers[1].legalName,
            coBuyerEmail:
              offerVersion.buyers[1].email,
            coBuyerPhone:
              offerVersion.buyers[1].phone,
          },
          {
            emitEvent: false,
          },
        );
      }

      this.updateCoBuyerControls();

      if (
        typeof savedSectionIndex === 'number' &&
        Number.isInteger(savedSectionIndex) &&
        savedSectionIndex >= 0 &&
        savedSectionIndex < this.sections.length
      ) {
        this.currentSectionIndex.set(savedSectionIndex);
      }

      this.resetCurrentSectionValidationState();
      this.startAutosave();

      if (hasSavedForm) {
        this.saveMessage.set('Draft restored');
      }

      this.loading.set(false);

      if (!hasSavedForm) {
        await this.queueDraftSave();
      }
    } catch (error: unknown) {
      console.error(
        'Unable to initialize the offer wizard.',
        error,
      );

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'The offer form could not be loaded.',
      );

      this.loading.set(false);
    }
  }

  private startAutosave(): void {
    this.offerForm.valueChanges
      .pipe(
        debounceTime(800),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        void this.queueDraftSave().catch(
          () => undefined,
        );
      });
  }

  updateCoBuyerControls(): void {
    const toggle =
      this.offerForm.controls.buyerProperty
        .controls.coBuyerEnabled;

    if (this.coBuyerLocked()) {
      toggle.disable({ emitEvent: false });
    } else {
      toggle.enable({ emitEvent: false });
    }

    const enabled = toggle.value === true;

    for (const field of [
      'coBuyerLegalName',
      'coBuyerEmail',
      'coBuyerPhone',
    ]) {
      const control = this.offerForm.get(
        `buyerProperty.${field}`,
      );

      if (enabled && !this.coBuyerLocked()) {
        control?.enable({ emitEvent: false });
      } else {
        control?.disable({ emitEvent: false });
      }
    }
  }

  private draftBuyers():
    OfferVersionPartySnapshot[] | null {
    const primary = this.primaryBuyer;

    if (!primary) {
      return null;
    }

    const form =
      this.offerForm.getRawValue().buyerProperty;

    if (
      !form.coBuyerEnabled ||
      this.coBuyerLocked()
    ) {
      return null;
    }

    const group =
      this.offerForm.get('buyerProperty');

    if (!group?.valid) {
      return null;
    }

    const legalName =
      (form.coBuyerLegalName ?? '').trim();

    const nameParts = legalName.split(/\s+/);

    return [
      primary,
      {
        partyUid: this.coBuyerUid,
        role: 'buyer',
        capacity: 'individual',
        firstName: nameParts[0] ?? '',
        lastName: nameParts.slice(1).join(' '),
        legalName,
        email:
          (form.coBuyerEmail ?? '')
            .trim()
            .toLowerCase(),
        phone:
          (form.coBuyerPhone ?? '').trim(),
        mailingAddress: {
          ...primary.mailingAddress,
        },
        sequence: 2,
        primaryParty: false,
        intendedUse:
          primary.intendedUse ??
          'primary_residence',
        proposedDeedName: legalName,
        requiredSigner: true,
        identityVerification: {
          status: 'not_started',
          provider: 'stripe_identity',
          legalNameApplied: false,
        },
        signature: {
          status: 'not_started',
        },
        electronicTransactionsConsentAccepted:
          false,
      },
    ];
  }

  private createWizardData():
    Record<string, unknown> {
    return {
      schemaVersion: 2,
      currentSectionIndex:
        this.currentSectionIndex(),
      form: this.offerForm.getRawValue(),
    };
  }

  private createTerms(): OfferTerms {
    if (!this.existingTerms) {
      throw new Error('The existing offer terms are unavailable.');
    }
    return createNorthCarolinaOfferTerms(this.offerForm.getRawValue(), this.existingTerms);
  }

  private queueDraftSave(): Promise<void> {
    this.saveChain = this.saveChain
      .catch(() => undefined)
      .then(() => this.saveCurrentDraft());

    return this.saveChain;
  }

  private async saveCurrentDraft(): Promise<void> {
    if (
      !this.offerUid ||
      !this.offerVersionUid ||
      !this.existingTerms ||
      this.loading()
    ) {
      return;
    }

    const wizardData = this.createWizardData();
    const terms = this.createTerms();
    const buyers = this.draftBuyers();

    this.saving.set(true);
    this.saveMessage.set('');

    try {
      await this.session().saveDraft({
        terms,
        wizardData,
        ...(buyers ? { buyers } : {}),
        expiresAt: terms.delivery.expiresAt,
      });

      this.existingTerms = terms;

      if (buyers) {
        this.coBuyerLocked.set(true);
        this.updateCoBuyerControls();
      }

      this.saveMessage.set('Draft saved');
    } catch (error: unknown) {
      console.error(
        'Unable to save the offer draft.',
        error,
      );

      this.saveMessage.set('');

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Your offer draft could not be saved. Please try again.',
      );

      throw error;
    } finally {
      this.saving.set(false);
    }
  }

  get currentSectionGroup(): FormGroup {
    const section = this.offerForm.get(
      this.currentSection().key,
    );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        'The requested offer section is unavailable.',
      );
    }

    return section;
  }

  isSectionComplete(sectionKey: string): boolean {
    return this.offerForm.get(sectionKey)?.valid === true;
  }

  async goToSection(
    sectionIndex: number,
  ): Promise<void> {
    if (
      sectionIndex < 0 ||
      sectionIndex >= this.sections.length
    ) {
      return;
    }

    if (
      sectionIndex > this.currentSectionIndex()
    ) {
      this.validationAttemptedSection.set(
        this.currentSection().key,
      );

      this.currentSectionGroup.markAllAsTouched();

      if (this.currentSectionGroup.invalid) {
        this.errorMessage.set(
          'Please complete the required information before continuing.',
        );

        return;
      }
    }

    this.errorMessage.set('');
    this.validationAttemptedSection.set(null);
    this.currentSectionIndex.set(sectionIndex);

    this.resetCurrentSectionValidationState();

    await this.queueDraftSave();

    this.scrollToTop();
  }

  async continue(): Promise<void> {
    this.validationAttemptedSection.set(
      this.currentSection().key,
    );

    this.currentSectionGroup.markAllAsTouched();

    if (this.currentSectionGroup.invalid) {
      this.errorMessage.set(
        'Please complete the required information before continuing.',
      );

      return;
    }

    this.errorMessage.set('');
    this.validationAttemptedSection.set(null);

    if (this.isLastSection()) {
      await this.submitCurrentOffer();
      return;
    }

    this.currentSectionIndex.update(
      index => index + 1,
    );

    this.resetCurrentSectionValidationState();

    await this.queueDraftSave();

    this.scrollToTop();
  }

  async previous(): Promise<void> {
    if (this.isFirstSection()) {
      await this.returnToListing();
      return;
    }

    this.errorMessage.set('');
    this.validationAttemptedSection.set(null);

    this.currentSectionIndex.update(
      index => index - 1,
    );

    this.resetCurrentSectionValidationState();

    await this.queueDraftSave();

    this.scrollToTop();
  }

  async returnToListing(): Promise<void> {
    if (
      this.offerUid &&
      this.offerVersionUid
    ) {
      try {
        await this.queueDraftSave();
      } catch {
        return;
      }
    }

    await this.session().returnToListing();
  }

  private resetCurrentSectionValidationState():
    void {
    this.currentSectionGroup.markAsPristine();
    this.currentSectionGroup.markAsUntouched();
  }

  private async submitCurrentOffer():
    Promise<void> {
    if (!this.prepareForSubmission()) {
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.saveMessage.set('');

    try {
      await this.queueDraftSave();

      await this.session().submitOffer();
    } catch (error: unknown) {
      console.error(
        'Unable to prepare the offer for signature.',
        error,
      );

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Your agreement could not be prepared. Please try again.',
      );

      this.scrollToTop();
    } finally {
      this.submitting.set(false);
    }
  }

  private prepareForSubmission(): boolean {
    this.offerForm.markAllAsTouched();

    if (this.offerForm.invalid) {
      const firstInvalidSection =
        this.findFirstInvalidSection();

      this.currentSectionIndex.set(
        firstInvalidSection,
      );

      this.validationAttemptedSection.set(
        this.currentSection().key,
      );

      this.errorMessage.set(
        'The offer contains missing or invalid information. Please review the highlighted fields.',
      );

      this.scrollToTop();
      return false;
    }

    return true;
  }

  private findFirstInvalidSection(): number {
    const invalidIndex = this.sections.findIndex(
      section =>
        this.offerForm.get(section.key)?.invalid === true,
    );

    return invalidIndex >= 0
      ? invalidIndex
      : 0;
  }

  private scrollToTop(): void {
    globalThis.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}

function priceFundingValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (
    control.get(
      'otherPropertyWillFundPurchase',
    )?.value === true &&
    !hasText(
      control.get(
        'otherPropertyDescription',
      )?.value,
    )
  ) {
    return {
      otherPropertyDescriptionRequired: true,
    };
  }

  return null;
}

function dueDiligenceValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const deadlineType = control.get(
    'dueDiligenceDeadlineType',
  )?.value;

  if (
    deadlineType === 'specific_date' &&
    !hasText(
      control.get(
        'dueDiligenceEndDate',
      )?.value,
    )
  ) {
    return {
      dueDiligenceEndDateRequired: true,
    };
  }

  if (
    deadlineType === 'days_after_effective_date'
  ) {
    const days = Number(
      control.get(
        'dueDiligenceDaysAfterEffectiveDate',
      )?.value,
    );

    if (
      !Number.isInteger(days) ||
      days <= 0 ||
      days > 365
    ) {
      return {
        dueDiligenceDaysRequired: true,
      };
    }
  }

  return null;
}

function concessionsValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const type = control.get(
    'concessionType',
  )?.value;

  if (
    type === 'amount' &&
    !isPositiveNumber(
      control.get(
        'sellerConcessionAmount',
      )?.value,
    )
  ) {
    return {
      concessionAmountRequired: true,
    };
  }

  if (
    type === 'percentage' &&
    !isPositiveNumber(
      control.get(
        'sellerConcessionPercentage',
      )?.value,
    )
  ) {
    return {
      concessionPercentageRequired: true,
    };
  }

  if (
    control.get(
      'homeWarrantyRequested',
    )?.value === true &&
    !isPositiveNumber(
      control.get(
        'homeWarrantyAmount',
      )?.value,
    )
  ) {
    return {
      homeWarrantyAmountRequired: true,
    };
  }

  return null;
}

function propertyInclusionsValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (
    control.get(
      'separatePropertyIncluded',
    )?.value === true &&
    !hasText(
      control.get(
        'separatePropertyDescription',
      )?.value,
    )
  ) {
    return {
      separatePropertyDescriptionRequired: true,
    };
  }

  return null;
}

function settlementPossessionValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (
    control.get(
      'possessionTiming',
    )?.value === 'other' &&
    !hasText(
      control.get(
        'possessionAgreementDocumentUid',
      )?.value,
    )
  ) {
    return {
      possessionAgreementRequired: true,
    };
  }

  return null;
}

function additionalTermsValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (
    control.get(
      'hasAdditionalTerms',
    )?.value !== true
  ) {
    return null;
  }

  const preparedBy = control.get(
    'preparedBy',
  )?.value;

  if (
    preparedBy !== 'buyer' &&
    preparedBy !== 'seller' &&
    preparedBy !== 'attorney'
  ) {
    return {
      preparedByRequired: true,
    };
  }

  if (
    !hasText(
      control.get(
        'documentUid',
      )?.value,
    )
  ) {
    return {
      additionalTermsDocumentRequired: true,
    };
  }

  return null;
}

function offerExpirationValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const expirationDate = control.get(
    'expirationDate',
  )?.value;

  const expirationTime = control.get(
    'expirationTime',
  )?.value;

  if (
    !expirationDate ||
    !expirationTime
  ) {
    return null;
  }

  const expiration = new Date(
    String(expirationDate) +
    'T' +
    String(expirationTime) +
    ':00',
  );

  if (
    Number.isNaN(expiration.getTime())
  ) {
    return {
      invalidExpiration: true,
    };
  }

  return expiration.getTime() <= Date.now()
    ? {
        expirationNotFuture: true,
      }
    : null;
}



function splitExpiration(
  expiresAt: string,
): {
  date: string;
  time: string;
} {
  if (!expiresAt) {
    return {
      date: '',
      time: '',
    };
  }

  const expiration = new Date(expiresAt);

  if (
    Number.isNaN(expiration.getTime())
  ) {
    return {
      date: '',
      time: '',
    };
  }

  const year = expiration.getFullYear();

  const month = String(
    expiration.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    expiration.getDate(),
  ).padStart(2, '0');

  const hours = String(
    expiration.getHours(),
  ).padStart(2, '0');

  const minutes = String(
    expiration.getMinutes(),
  ).padStart(2, '0');

  return {
    date:
      year + '-' + month + '-' + day,
    time:
      hours + ':' + minutes,
  };
}





function fromCents(
  value: number,
): number {
  return value / 100;
}

function fromOptionalCents(
  value: number | undefined,
): number | null {
  return typeof value === 'number'
    ? fromCents(value)
    : null;
}







function disclosureStatusForForm(
  value: OfferTerms[
    'buyerDisclosures'
  ]['residentialProperty']['status'],
): string {
  return value === 'unselected'
    ? ''
    : value;
}

function hasText(
  value: unknown,
): boolean {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  );
}

function isPositiveNumber(
  value: unknown,
): boolean {
  const parsed = Number(value);

  return (
    Number.isFinite(parsed) &&
    parsed > 0
  );
}

function formatUsPhoneNumber(
  value: string,
): string {
  let digits = value.replace(
    /\D/g,
    '',
  );

  if (
    digits.length === 11 &&
    digits.startsWith('1')
  ) {
    digits = digits.slice(1);
  }

  digits = digits.slice(0, 10);

  if (digits.length !== 10) {
    return value;
  }

  return (
    '(' + digits.slice(0, 3) + ') ' +
    digits.slice(3, 6) + '-' +
    digits.slice(6)
  );
}