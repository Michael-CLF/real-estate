import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

import {
  debounceTime,
  firstValueFrom
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  AdditionalTermsSectionComponent
} from '../components/additional-terms-section/additional-terms-section.component';

import {
  BuyerPropertySectionComponent
} from '../components/buyer-property-section/buyer-property-section.component';

import {
  ConcessionsSectionComponent
} from '../components/concessions-section/concessions-section.component';

import {
  DepositsDueDiligenceSectionComponent
} from '../components/deposits-due-diligence-section/deposits-due-diligence-section.component';

import {
  DisclosuresAddendaSectionComponent
} from '../components/disclosures-addenda-section/disclosures-addenda-section.component';

import {
  InvestigationsSectionComponent
} from '../components/investigations-section/investigations-section.component';

import {
  OfferExpirationSectionComponent
} from '../components/offer-expiration-section/offer-expiration-section.component';

import {
  OfferReviewSectionComponent
} from '../components/offer-review-section/offer-review-section.component';

import {
  PriceFinancingSectionComponent
} from '../components/price-financing-section/price-financing-section.component';

import {
  PropertyInclusionsSectionComponent
} from '../components/property-inclusions-section/property-inclusions-section.component';

import {
  SettlementPossessionSectionComponent
} from '../components/settlement-possession-section/settlement-possession-section.component';

import {
  AccountState
} from '../../../core/authentication/state/account.state';

import {
  MarketplaceListingRepository
} from '../../../core/domains/marketplace/repositories/marketplace-listing.repository';

import {
  FirestoreMarketplaceListingRepository
} from '../../../core/domains/marketplace/repositories/firestore-marketplace-listing.repository';

import {
  OfferService
} from '../../../core/domains/offers/services/offer.service';

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
    InvestigationsSectionComponent,
    OfferExpirationSectionComponent,
    OfferReviewSectionComponent,
    PriceFinancingSectionComponent,
    PropertyInclusionsSectionComponent,
    SettlementPossessionSectionComponent
  ],

  providers: [
    {
      provide:
        MarketplaceListingRepository,

      useClass:
        FirestoreMarketplaceListingRepository
    }
  ],

  templateUrl:
    './offer-wizard.component.html',

  styleUrl:
    './offer-wizard.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class OfferWizardComponent
  implements OnInit {

  private readonly formBuilder =
    inject(FormBuilder);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly offerService =
    inject(OfferService);

  private offerUid = '';

  private offerVersionUid = '';

  private lastSavedSnapshot = '';

  private saveChain:
    Promise<void> =
    Promise.resolve();

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly accountState =
    inject(AccountState);

  private readonly listingRepository =
    inject(MarketplaceListingRepository);

  readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ??
    this.route.snapshot.paramMap.get(
      'id'
    ) ??
    '';

  readonly currentSectionIndex =
    signal(0);

  readonly saving =
    signal(false);

  readonly submitting =
    signal(false);

  readonly loading =
    signal(true);

  readonly errorMessage =
    signal('');

  readonly saveMessage =
    signal('');

  readonly sections:
    readonly OfferWizardSection[] = [
      {
        key:
          'buyerProperty',

        title:
          'Buyer and Property',

        shortTitle:
          'Buyer',

        description:
          'Confirm the buyer’s legal identity and the property being purchased.'
      },

      {
        key:
          'priceFinancing',

        title:
          'Purchase Price and Financing',

        shortTitle:
          'Price',

        description:
          'Enter the proposed purchase price and how the purchase will be funded.'
      },

      {
        key:
          'depositsDueDiligence',

        title:
          'Deposits and Due Diligence',

        shortTitle:
          'Deposits',

        description:
          'Enter the proposed earnest money, due-diligence fee and due-diligence period.'
      },

      {
        key:
          'investigations',

        title:
          'Investigations and Conditions',

        shortTitle:
          'Conditions',

        description:
          'Identify requested inspections, appraisal, financing and property-sale conditions.'
      },

      {
        key:
          'concessions',

        title:
          'Seller Concessions',

        shortTitle:
          'Concessions',

        description:
          'Enter any closing costs, credits or other concessions requested from the seller.'
      },

      {
        key:
          'propertyInclusions',

        title:
          'Property and Personal Property',

        shortTitle:
          'Inclusions',

        description:
          'Identify fixtures, personal property and other items requested with the property.'
      },

      {
        key:
          'settlementPossession',

        title:
          'Settlement and Possession',

        shortTitle:
          'Closing',

        description:
          'Enter the proposed settlement date, possession date and settlement preferences.'
      },

      {
        key:
          'disclosuresAddenda',

        title:
          'Disclosures and Addenda',

        shortTitle:
          'Disclosures',

        description:
          'Identify applicable disclosures, addenda and supporting documents.'
      },

      {
        key:
          'additionalTerms',

        title:
          'Additional Requested Terms',

        shortTitle:
          'Terms',

        description:
          'Review any additional requested terms and determine whether attorney-drafted language is required.'
      },

      {
        key:
          'offerExpiration',

        title:
          'Offer Expiration',

        shortTitle:
          'Expiration',

        description:
          'Specify when the offer expires if it has not been accepted.'
      },

      {
        key:
          'offerReview',

        title:
          'Review and Certification',

        shortTitle:
          'Review',

        description:
          'Review the complete offer, accept the required certifications and prepare it for submission.'
      }
    ];

  readonly currentSection =
    computed(
      () =>
        this.sections[
        this.currentSectionIndex()
        ]
    );

  readonly isFirstSection =
    computed(
      () =>
        this.currentSectionIndex() === 0
    );

  readonly isLastSection =
    computed(
      () =>
        this.currentSectionIndex() ===
        this.sections.length - 1
    );

  readonly progressPercentage =
    computed(
      () =>
        (
          (
            this.currentSectionIndex() +
            1
          ) /
          this.sections.length
        ) *
        100
    );

  readonly offerForm =
    this.formBuilder.group({
      buyerProperty:
        this.formBuilder.group({
          buyerFirstName: [
            '',
            [
              Validators.required,
              Validators.maxLength(100)
            ]
          ],

          buyerMiddleName: [
            '',
            [
              Validators.maxLength(100)
            ]
          ],

          buyerLastName: [
            '',
            [
              Validators.required,
              Validators.maxLength(100)
            ]
          ],

          buyerSuffix: [
            '',
            [
              Validators.maxLength(20)
            ]
          ],

          buyerEmail: [
            '',
            [
              Validators.required,
              Validators.email,
              Validators.maxLength(254)
            ]
          ],

          buyerPhone: [
            '',
            [
              Validators.required,
              Validators.pattern(
                /^\(\d{3}\) \d{3}-\d{4}$/
              )
            ]
          ],

          propertyAddress: [
            {
              value: '',
              disabled: true
            },
            [
              Validators.required
            ]
          ],

          propertyCounty: [
            {
              value: '',
              disabled: true
            }
          ],

          propertyState: [
            {
              value: 'NC',
              disabled: true
            }
          ],

          propertyPostalCode: [
            {
              value: '',
              disabled: true
            }
          ],

          propertyParcelId: [
            {
              value: '',
              disabled: true
            }
          ]
        }),

      priceFinancing:
        this.formBuilder.group({
          purchasePrice: [
            null as number | null,
            [
              Validators.required,
              Validators.min(1)
            ]
          ],

          financingMethod: [
            '',
            [
              Validators.required
            ]
          ],

          loanType: [
            ''
          ],

          otherLoanType: [
            '',
            [
              Validators.maxLength(100)
            ]
          ],

          loanAmount: [
            null as number | null,
            [
              Validators.min(0)
            ]
          ],

          downPaymentAmount: [
            null as number | null,
            [
              Validators.min(0)
            ]
          ],

          downPaymentPercentage: [
            null as number | null,
            [
              Validators.min(0),
              Validators.max(100)
            ]
          ],

          preapprovalProvided: [
            false
          ],

          proofOfFundsProvided: [
            false
          ],

          financingContingencyRequested: [
            false
          ],

          financingApplicationDays: [
            null as number | null,
            [
              Validators.min(0),
              Validators.max(365)
            ]
          ],

          financingNotes: [
            '',
            [
              Validators.maxLength(1000)
            ]
          ]
        }),

      depositsDueDiligence:
        this.formBuilder.group({
          earnestMoneyAmount: [
            null as number | null,
            [
              Validators.required,
              Validators.min(0)
            ]
          ],

          earnestMoneyDeliveryDays: [
            null as number | null,
            [
              Validators.required,
              Validators.min(0),
              Validators.max(365)
            ]
          ],

          additionalEarnestMoneyAmount: [
            null as number | null,
            [
              Validators.min(0)
            ]
          ],

          additionalEarnestMoneyDueDate: [
            ''
          ],

          dueDiligenceFeeAmount: [
            null as number | null,
            [
              Validators.required,
              Validators.min(0)
            ]
          ],

          dueDiligenceExpirationDate: [
            '',
            [
              Validators.required
            ]
          ],
        }),

      investigations:
        this.formBuilder.group({
          inspectionIntended: [
            false
          ],

          appraisalContingencyRequested: [
            false
          ],

          financingContingencyRequested: [
            false
          ],

          saleOfExistingHomeRequired: [
            false
          ],

          existingHomeAddress: [
            '',
            [
              Validators.maxLength(300)
            ]
          ],

          existingHomeStatus: [
            ''
          ],

          existingHomeDeadline: [
            ''
          ],

          buyerInvestigationNotes: [
            '',
            [
              Validators.maxLength(1500)
            ]
          ]
        }),

      concessions:
        this.formBuilder.group({
          sellerPaidClosingCostsRequested: [
            false
          ],

          sellerPaidClosingCostsAmount: [
            null as number | null,
            [
              Validators.min(0)
            ]
          ],

          sellerPaidClosingCostsPercentage: [
            null as number | null,
            [
              Validators.min(0),
              Validators.max(100)
            ]
          ],

          repairCreditRequested: [
            false
          ],

          repairCreditAmount: [
            null as number | null,
            [
              Validators.min(0)
            ]
          ],

          otherConcessions: [
            '',
            [
              Validators.maxLength(1000)
            ]
          ]
        }),

      propertyInclusions:
        this.formBuilder.group({
          builtInAppliancesIncluded: [
            true
          ],

          refrigeratorIncluded: [
            false
          ],

          washerIncluded: [
            false
          ],

          dryerIncluded: [
            false
          ],

          windowTreatmentsIncluded: [
            false
          ],

          securitySystemsIncluded: [
            false
          ],

          fuelOrPropaneIncluded: [
            false
          ],

          otherPersonalProperty: [
            '',
            [
              Validators.maxLength(1500)
            ]
          ],

          excludedItems: [
            '',
            [
              Validators.maxLength(1500)
            ]
          ]
        }),

      settlementPossession:
        this.formBuilder.group(
          {
            proposedSettlementDate: [
              '',
              [
                Validators.required
              ]
            ],

            proposedPossessionDate: [
              '',
              [
                Validators.required
              ]
            ],

            possessionTiming: [
              'at_closing',
              [
                Validators.required
              ]
            ],

            possessionNotes: [
              '',
              [
                Validators.maxLength(1000)
              ]
            ],

            settlementAgentPreference: [
              '',
              [
                Validators.maxLength(200)
              ]
            ],

            settlementLocationPreference: [
              '',
              [
                Validators.maxLength(300)
              ]
            ]
          },
          {
            validators: [
              possessionNotBeforeSettlementValidator
            ]
          }
        ),

      disclosuresAddenda:
        this.formBuilder.group({
          propertyDisclosureReceived: [
            false
          ],

          mineralOilGasDisclosureReceived: [
            false
          ],

          leadBasedPaintAddendumRequired: [
            false
          ],

          ownersAssociationAddendumRequired: [
            false
          ],

          septicOrWellAddendumRequired: [
            false
          ],

          saleOfExistingPropertyAddendumRequired: [
            false
          ],

          otherAddenda: [
            '',
            [
              Validators.maxLength(1000)
            ]
          ],

          supportingDocumentUids:
            this.formBuilder.control<
              string[]
            >([])
        }),

      additionalTerms:
        this.formBuilder.group({
          hasAdditionalTerms: [
            false
          ],

          standardRequestedTerms: [
            '',
            [
              Validators.maxLength(1500)
            ]
          ],

          attorneyDraftedLanguageRequired: [
            false
          ],

          attorneyUid: [
            ''
          ],

          attorneyDocumentUid: [
            ''
          ],

          attorneyReviewStatus: [
            'not_required'
          ]
        }),

      offerExpiration:
        this.formBuilder.group(
          {
            expirationDate: [
              '',
              [
                Validators.required
              ]
            ],

            expirationTime: [
              '',
              [
                Validators.required
              ]
            ],

            timeZone: [
              'America/New_York',
              [
                Validators.required
              ]
            ]
          },
          {
            validators: [
              offerExpirationValidator
            ]
          }
        ),

      offerReview:
        this.formBuilder.group({
          informationCertified: [
            false,
            [
              Validators.requiredTrue
            ]
          ],

          electronicRecordsConsent: [
            false,
            [
              Validators.requiredTrue
            ]
          ],

          electronicSignatureConsent: [
            false,
            [
              Validators.requiredTrue
            ]
          ],

          navStreetDisclaimerAccepted: [
            false,
            [
              Validators.requiredTrue
            ]
          ],

          attorneyLanguageAcknowledged: [
            false,
            [
              Validators.requiredTrue
            ]
          ]
        })
    });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');
    this.saveMessage.set('');

    try {
      if (!this.listingUid) {
        throw new Error(
          'The property listing identifier is missing.'
        );
      }

      const profile =
        this.accountState.profile();

      if (!profile) {
        throw new Error(
          'The authenticated NavStreet account could not be loaded.'
        );
      }

      /*
       * Create the buyer's offer draft or return the
       * existing editable draft for this listing.
       */
      const draftResult =
        await this.offerService
          .createOrResumeDraft(
            this.listingUid
          );

      this.offerUid =
        draftResult.offerUid;

      this.offerVersionUid =
        draftResult.offerVersionUid;

      const [
        listing,
        offerVersion
      ] =
        await Promise.all([
          firstValueFrom(
            this.listingRepository
              .getListingById(
                this.listingUid
              )
          ),

          this.offerService.getVersion(
            this.offerUid,
            this.offerVersionUid
          )
        ]);

      if (!listing) {
        throw new Error(
          'The selected property listing could not be found.'
        );
      }

      if (!offerVersion) {
        throw new Error(
          'The offer draft could not be loaded.'
        );
      }

      const propertyAddress = [
        listing.address.addressLine1,
        listing.address.addressLine2
      ]
        .filter(Boolean)
        .join(', ');

      /*
       * Establish the initial values from the authenticated
       * account and published listing.
       */
      this.offerForm.patchValue(
        {
          buyerProperty: {
            buyerFirstName:
              profile.firstName,

            buyerMiddleName:
              '',

            buyerLastName:
              profile.lastName,

            buyerSuffix:
              '',

            buyerEmail:
              profile.email,

            buyerPhone:
              formatUsPhoneNumber(
                profile.phone ?? ''
              ),

            propertyAddress,

            propertyCounty:
              listing.address.county ??
              'Not provided',

            propertyState:
              listing.address
                .stateAbbreviation,

            propertyPostalCode:
              listing.address.postalCode,

            propertyParcelId:
              'Not provided'
          },

          priceFinancing: {
            purchasePrice:
              listing.price
          }
        },
        {
          emitEvent: false
        }
      );

      const savedWizardData =
        offerVersion.wizardData;

      const savedForm =
        savedWizardData?.['form'];

      const savedSectionIndex =
        savedWizardData?.[
          'currentSectionIndex'
        ];

      const hasSavedForm =
        savedForm !== null &&
        typeof savedForm === 'object' &&
        !Array.isArray(savedForm) &&
        Object.keys(
          savedForm as
            Record<string, unknown>
        ).length > 0;

      /*
       * Saved wizard values take precedence over profile
       * and listing defaults. Disabled property controls
       * are included because getRawValue() is used when
       * the draft is saved.
       */
      if (hasSavedForm) {
        this.offerForm.patchValue(
          savedForm as
            ReturnType<
              typeof this.offerForm.getRawValue
            >,
          {
            emitEvent: false
          }
        );
      }

      if (
        typeof savedSectionIndex ===
          'number' &&
        Number.isInteger(
          savedSectionIndex
        ) &&
        savedSectionIndex >= 0 &&
        savedSectionIndex <
          this.sections.length
      ) {
        this.currentSectionIndex.set(
          savedSectionIndex
        );
      }

      this.startAutosave();

      if (hasSavedForm) {
        this.lastSavedSnapshot =
          JSON.stringify(
            this.createWizardData()
          );

        this.saveMessage.set(
          'Draft restored'
        );
      }

      this.loading.set(false);

      /*
       * A new draft is saved immediately so the populated
       * account, property and purchase-price values are
       * preserved even if the buyer leaves without typing.
       */
      if (!hasSavedForm) {
        await this.queueDraftSave();
      }
    } catch (error: unknown) {
      console.error(
        'Unable to initialize the offer wizard.',
        error
      );

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'The offer form could not be loaded.'
      );

      this.loading.set(false);
    }
  }

  private startAutosave(): void {
    this.offerForm.valueChanges
      .pipe(
        debounceTime(800),

        takeUntilDestroyed(
          this.destroyRef
        )
      )
      .subscribe(
        () => {
          void this.queueDraftSave();
        }
      );
  }

  private createWizardData():
    Record<string, unknown> {
    return {
      currentSectionIndex:
        this.currentSectionIndex(),

      /*
       * getRawValue() includes the disabled property
       * fields copied from the published listing.
       */
      form:
        this.offerForm.getRawValue()
    };
  }

  private queueDraftSave():
    Promise<void> {
    this.saveChain =
      this.saveChain
        .catch(
          () => undefined
        )
        .then(
          () =>
            this.saveCurrentDraft()
        );

    return this.saveChain;
  }

  private async saveCurrentDraft():
    Promise<void> {
    if (
      !this.offerUid ||
      !this.offerVersionUid ||
      this.loading()
    ) {
      return;
    }

    const wizardData =
      this.createWizardData();

    const serializedSnapshot =
      JSON.stringify(
        wizardData
      );

    /*
     * Navigation and autosave can request the same save.
     * Avoid writing an identical snapshot twice.
     */
    if (
      serializedSnapshot ===
      this.lastSavedSnapshot
    ) {
      return;
    }

    this.saving.set(true);
    this.saveMessage.set('');

    try {
      await this.offerService.saveDraft(
        this.offerUid,
        this.offerVersionUid,
        {
          wizardData
        }
      );

      this.lastSavedSnapshot =
        serializedSnapshot;

      this.saveMessage.set(
        'Draft saved'
      );
    } catch (error: unknown) {
      console.error(
        'Unable to save the offer draft.',
        error
      );

      this.saveMessage.set('');

      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'Your offer draft could not be saved. Please try again.'
      );

      throw error;
    } finally {
      this.saving.set(false);
    }
  }

  get currentSectionGroup():
    FormGroup {
    const section =
      this.offerForm.get(
        this.currentSection().key
      );

    if (!(section instanceof FormGroup)) {
      throw new Error(
        `Offer section "${this.currentSection().key}" is unavailable.`
      );
    }

    return section;
  }

  async goToSection(
    sectionIndex: number
  ): Promise<void> {
    if (
      sectionIndex < 0 ||
      sectionIndex >=
        this.sections.length
    ) {
      return;
    }

    if (
      sectionIndex >
      this.currentSectionIndex()
    ) {
      this.currentSectionGroup
        .markAllAsTouched();

      if (
        this.currentSectionGroup.invalid
      ) {
        this.errorMessage.set(
          'Please complete the required information before continuing.'
        );

        return;
      }
    }

    this.errorMessage.set('');

    this.currentSectionIndex.set(
      sectionIndex
    );

    await this.queueDraftSave();

    this.scrollToTop();
  }

  async continue(): Promise<void> {
    this.currentSectionGroup
      .markAllAsTouched();

    if (
      this.currentSectionGroup.invalid
    ) {
      this.errorMessage.set(
        'Please complete the required information before continuing.'
      );

      return;
    }

    this.errorMessage.set('');

    if (this.isLastSection()) {
      await this.queueDraftSave();

      this.prepareForSubmission();
      return;
    }

    this.currentSectionIndex.update(
      index => index + 1
    );

    await this.queueDraftSave();

    this.scrollToTop();
  }

  async previous(): Promise<void> {
    if (this.isFirstSection()) {
      await this.returnToListing();
      return;
    }

    this.errorMessage.set('');

    this.currentSectionIndex.update(
      index => index - 1
    );

    await this.queueDraftSave();

    this.scrollToTop();
  }

  async returnToListing():
    Promise<void> {
    if (
      this.offerUid &&
      this.offerVersionUid
    ) {
      try {
        await this.queueDraftSave();
      } catch {
        /*
         * The save error is already displayed. Do not
         * silently navigate away after a failed final save.
         */
        return;
      }
    }

    if (this.listingUid) {
      await this.router.navigate([
        '/listings',
        this.listingUid
      ]);

      return;
    }

    await this.router.navigate([
      '/buy'
    ]);
  }

  private prepareForSubmission(): void {
    this.offerForm.markAllAsTouched();

    if (this.offerForm.invalid) {
      const firstInvalidSection =
        this.findFirstInvalidSection();

      this.currentSectionIndex.set(
        firstInvalidSection
      );

      this.errorMessage.set(
        'The offer contains missing or invalid information. Please review the highlighted fields.'
      );

      this.scrollToTop();
      return;
    }

    /*
     * Submission will be connected after the section
     * components are complete and the final review screen
     * displays the complete offer.
     */
    this.saveMessage.set(
      'The offer is complete and ready for final review.'
    );
  }

  private findFirstInvalidSection():
    number {
    const invalidIndex =
      this.sections.findIndex(
        section =>
          this.offerForm
            .get(section.key)
            ?.invalid === true
      );

    return invalidIndex >= 0
      ? invalidIndex
      : 0;
  }

  private scrollToTop(): void {
    globalThis.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}

function possessionNotBeforeSettlementValidator(
  control: AbstractControl
): ValidationErrors | null {
  const settlementDate =
    control.get(
      'proposedSettlementDate'
    )?.value;

  const possessionDate =
    control.get(
      'proposedPossessionDate'
    )?.value;

  if (
    !settlementDate ||
    !possessionDate
  ) {
    return null;
  }

  const settlement =
    new Date(
      `${settlementDate}T00:00:00`
    );

  const possession =
    new Date(
      `${possessionDate}T00:00:00`
    );

  if (
    Number.isNaN(
      settlement.getTime()
    ) ||
    Number.isNaN(
      possession.getTime()
    )
  ) {
    return null;
  }

  return possession < settlement
    ? {
      possessionBeforeSettlement:
        true
    }
    : null;
}

function offerExpirationValidator(
  control: AbstractControl
): ValidationErrors | null {
  const expirationDate =
    control.get(
      'expirationDate'
    )?.value;

  const expirationTime =
    control.get(
      'expirationTime'
    )?.value;

  if (
    !expirationDate ||
    !expirationTime
  ) {
    return null;
  }

  const expiration =
    new Date(
      `${expirationDate}T${expirationTime}:00`
    );

  if (
    Number.isNaN(
      expiration.getTime()
    )
  ) {
    return {
      invalidExpiration:
        true
    };
  }

  return expiration.getTime() <=
    Date.now()
    ? {
      expirationNotFuture:
        true
    }
    : null;
}
function formatUsPhoneNumber(
  value: string
): string {
  let digits =
    value.replace(
      /\D/g,
      ''
    );

  if (
    digits.length === 11 &&
    digits.startsWith('1')
  ) {
    digits =
      digits.slice(1);
  }

  digits =
    digits.slice(0, 10);

  if (digits.length !== 10) {
    return value;
  }

  return (
    `(${digits.slice(0, 3)}) ` +
    `${digits.slice(3, 6)}-` +
    digits.slice(6)
  );
}