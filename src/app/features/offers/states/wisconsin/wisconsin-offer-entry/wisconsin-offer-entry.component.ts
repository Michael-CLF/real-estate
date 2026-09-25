import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  firstValueFrom,
} from 'rxjs';

import type {
  MarketplaceListing,
} from '../../../../../core/domains/marketplace/models/marketplace-listing.model';

import type {
  ListingDisclosureDocument,
} from '../../../../../core/domains/disclosures/models/listing-disclosure-document.model';

import {
  ListingDisclosureService,
} from '../../../../../core/domains/disclosures/services/listing-disclosure.service';

import {
  MarketplaceListingRepository,
} from '../../../../../core/domains/marketplace/repositories/marketplace-listing.repository';

import {
  FirestoreMarketplaceListingRepository,
} from '../../../../../core/domains/marketplace/repositories/firestore-marketplace-listing.repository';

import type {
  Offer,
} from '../../../../../core/domains/offers/models/offer.model';

import type {
  OfferParty,
} from '../../../../../core/domains/offers/models/offer-party.model';

import type {
  OfferPropertySnapshot,
} from '../../../../../core/domains/offers/models/offer-terms.model';

import type {
  OfferVersion,
  OfferVersionPartySnapshot,
} from '../../../../../core/domains/offers/models/offer-version.model';

import type {
  WisconsinOfferTerms,
} from '../../../../../core/domains/offers/state-contracts/wisconsin/models/wisconsin-offer-terms.model';

import {
  FirestoreOfferRepository,
} from '../../../../../core/domains/offers/repositories/firestore-offer.repository';

import {
  OfferDocumentService,
} from '../../../../../core/domains/offers/services/offer-document.service';

import type {
  OfferAttachmentType,
} from '../../../../../core/domains/offers/services/offer-document.service';

import {
  OfferService,
} from '../../../../../core/domains/offers/services/offer.service';

import type {
  OfferDocumentSelection,
} from '../../../engine/question-renderer/question-renderer.component';

import {
  OfferWizardComponent,
} from '../offer-wizard/offer-wizard.component';

import type {
  WisconsinOfferDraftChange,
} from '../offer-wizard/offer-wizard.component';


const DEFAULT_EXPIRATION_HOURS = 48;


@Component({
  selector:
    'app-wisconsin-offer-entry',

  standalone: true,

  imports: [
    OfferWizardComponent,
  ],

  providers: [
    {
      provide:
        MarketplaceListingRepository,

      useClass:
        FirestoreMarketplaceListingRepository,
    },
  ],

  templateUrl:
    './wisconsin-offer-entry.component.html',

  styleUrl:
    './wisconsin-offer-entry.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class WisconsinOfferEntryComponent
  implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly listingRepository =
    inject(MarketplaceListingRepository);

  private readonly offerRepository =
    inject(FirestoreOfferRepository);

  private readonly offerService =
    inject(OfferService);

  private readonly offerDocumentService =
    inject(OfferDocumentService);

  private readonly listingDisclosureService =
    inject(ListingDisclosureService);

  private readonly wizard =
    viewChild(OfferWizardComponent);

  protected readonly loading =
    signal(true);

  protected readonly creating =
    signal(false);

  protected readonly saving =
    signal(false);

  protected readonly uploading =
    signal(false);

  protected readonly submitting =
    signal(false);

  protected readonly errorMessage =
    signal('');

  protected readonly listing =
    signal<MarketplaceListing | null>(null);

  protected readonly listingDisclosures =
    signal<readonly ListingDisclosureDocument[]>([]);

  protected readonly property =
    signal<OfferPropertySnapshot | null>(null);

  protected readonly currentOffer =
    signal<Offer | null>(null);

  protected readonly currentVersion =
    signal<OfferVersion<WisconsinOfferTerms> | null>(null);

  protected readonly initialTerms =
    computed(
      () => this.currentVersion()?.terms ?? null
    );

  protected readonly buyers =
    computed<readonly OfferParty[]>(
      () =>
        this.toOfferParties(
          this.currentVersion()?.buyers ?? []
        )
    );

  protected readonly sellers =
    computed<readonly OfferParty[]>(
      () =>
        this.toOfferParties(
          this.currentVersion()?.sellers ?? []
        )
    );

  protected readonly expiresAt =
    computed(
      () =>
        this.currentVersion()
          ?.terms
          .delivery
          .expiresAt ??
        createDefaultExpiration()
    );

  protected readonly timeZone =
    computed(
      () =>
        this.currentVersion()
          ?.terms
          .delivery
          .timeZone ??
        'America/Chicago'
    );

  protected readonly busy =
    computed(
      () =>
        this.creating() ||
        this.saving() ||
        this.uploading() ||
        this.submitting()
    );

  private pendingDraftChange:
    WisconsinOfferDraftChange |
    null = null;

  private activeSave:
    Promise<void> |
    null = null;

  private listingUid =
    this.route.snapshot.paramMap.get('listingUid') ?? '';

  private readonly requestedOfferUid =
    (this.route.snapshot.paramMap.get('offerUid') ?? this.route.snapshot.queryParamMap
      .get('offerUid'))
      ?.trim() ?? '';

  private readonly requestedOfferVersionUid =
    (this.route.snapshot.paramMap.get('offerVersionUid') ?? this.route.snapshot.queryParamMap
      .get('offerVersionUid'))
      ?.trim() ?? '';


  async ngOnInit(): Promise<void> {
    try {
      if (this.requestedOfferUid && this.requestedOfferVersionUid) {
        const existing = await this.offerService.getOffer(this.requestedOfferUid);
        if (!existing) throw new Error('The saved offer could not be found.');
        this.listingUid = existing.listingUid;
      }
      if (!this.listingUid) {
        throw new Error(
          'The property listing identifier is missing.'
        );
      }

      const listing =
        await firstValueFrom(
          this.listingRepository
            .getListingById(
              this.listingUid
            )
        );

      if (!listing) {
        throw new Error(
          'The selected property listing could not be found.'
        );
      }

      const stateCode =
        (
          listing.address
            .stateAbbreviation ||
          listing.address.state
        )
          .trim()
          .toUpperCase();

      if (stateCode !== 'WI') {
        throw new Error(
          'The Wisconsin offer process can only be used for property located in Wisconsin.'
        );
      }

      if (!['single_family', 'townhome', 'pud'].includes(String(listing.propertyType))) {
        throw new Error('This Wisconsin agreement supports residential resales. Condominiums, vacant land, and other property types need their own agreement.');
      }

      this.listing.set(listing);
      this.property.set(
        createPropertySnapshot(listing)
      );

      const disclosureSummaries =
        await this.listingDisclosureService
          .getListingDisclosures(this.listingUid);
      this.listingDisclosures.set(
        disclosureSummaries.map(summary => summary.currentDocument)
      );

      if (
        Boolean(this.requestedOfferUid) !==
        Boolean(this.requestedOfferVersionUid)
      ) {
        throw new Error(
          'The offer link is missing its offer or version identifier.'
        );
      }

      if (
        this.requestedOfferUid &&
        this.requestedOfferVersionUid
      ) {
        await this.loadOfferSession(
          this.requestedOfferUid,
          this.requestedOfferVersionUid,
          'navstreet_wisconsin_residential_sale_2026'
        );
      } else {
        await this.resumeExistingDraft();

        if (!this.currentVersion()) {
          await this.createInitialDraft();
        }
      }

    } catch (error) {
      this.setError(
        error,
        'The Wisconsin offer process could not be opened.'
      );
    } finally {
      this.loading.set(false);
    }
  }


  private async createInitialDraft(): Promise<void> {
    if (
      this.busy() ||
      this.currentVersion()
    ) {
      return;
    }

    this.creating.set(true);
    this.errorMessage.set('');

    try {
      const result =
        await this.offerService
          .createOrResumeDraft(
            this.listingUid,
            'navstreet_wisconsin_residential_sale_2026'
          );

      await this.loadOfferSession(
        result.offerUid,
        result.offerVersionUid,
        'navstreet_wisconsin_residential_sale_2026'
      );
    } catch (error) {
      this.setError(
        error,
        'The Wisconsin offer draft could not be created.'
      );
    } finally {
      this.creating.set(false);
    }
  }


  protected onDraftChanged(
    change: WisconsinOfferDraftChange
  ): void {
    if (
      !this.currentOffer() ||
      !this.currentVersion()
    ) {
      return;
    }

    this.pendingDraftChange = change;
    void this.flushDraftSave();
  }


  protected async onDocumentSelected(
    selection: OfferDocumentSelection
  ): Promise<void> {
    const offer = this.currentOffer();
    const version = this.currentVersion();

    if (
      !offer ||
      !version ||
      this.busy()
    ) {
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set('');

    try {
      const result =
        await this.offerDocumentService
          .uploadAttachment(
            offer.Uid,
            version.Uid,
            resolveAttachmentType(
              selection.fieldPath
            ),
            selection.file
          );

      this.wizard()
        ?.applyDocumentUid(
          selection.fieldPath,
          result.documentUid
        );
    } catch (error) {
      this.setError(
        error,
        'The selected document could not be uploaded.'
      );
    } finally {
      this.uploading.set(false);
    }
  }


  protected async onSubmitRequested(
    change: WisconsinOfferDraftChange
  ): Promise<void> {
    const offer = this.currentOffer();
    const version = this.currentVersion();

    if (
      !offer ||
      !version ||
      this.busy()
    ) {
      return;
    }

    this.pendingDraftChange = change;

    this.submitting.set(true);
    this.errorMessage.set('');

    try {
      await this.flushDraftSave();

      await this.offerService
        .submitVersion(
          offer.Uid,
          version.Uid
        );

      await this.offerDocumentService
        .generateAgreement(
          offer.Uid,
          version.Uid,
          version.versionNumber === 1
            ? 'offer_agreement'
            : 'counteroffer_agreement'
        );

      await this.router.navigate([
        '/offers',
        offer.Uid,
      ]);
    } catch (error) {
      this.setError(
        error,
        'Your Wisconsin agreement could not be prepared.'
      );
    } finally {
      this.submitting.set(false);
    }
  }


  protected async returnToListing():
    Promise<void> {
    try {
      await this.flushDraftSave();
    } catch {
      return;
    }

    await this.router.navigate([
      '/listings',
      this.listingUid,
    ]);
  }


  private async resumeExistingDraft():
    Promise<void> {
    const existingOffer =
      await this.offerRepository
        .getOpenOfferForBuyerAndListing(
          this.offerService.currentUserUid,
          this.listingUid
        );

    if (!existingOffer) {
      return;
    }

    if (existingOffer.status !== 'draft') {
      throw new Error(
        'You already have an active offer for this property. Open it from your Offers dashboard.'
      );
    }

    await this.loadOfferSession(
      existingOffer.Uid,
      existingOffer.currentVersionUid
    );
  }


  private async loadOfferSession(
    offerUid: string,
    offerVersionUid: string,
    expectedContractType?: string
  ): Promise<void> {
    const [offer, version] =
      await Promise.all([
        this.offerService.getOffer(
          offerUid
        ),
        this.offerService
          .getVersion<WisconsinOfferTerms>(
            offerUid,
            offerVersionUid
          ),
      ]);

    if (!offer || !version) {
      throw new Error(
        'The Wisconsin offer draft could not be loaded.'
      );
    }

    if (
      offer.stateCode !== 'WI' ||
      version.stateCode !== 'WI' ||
      version.terms.stateCode !== 'WI'
    ) {
      throw new Error(
        'The saved offer does not contain a Wisconsin contract.'
      );
    }

    if (
      expectedContractType &&
      version.terms.contractType !==
      expectedContractType
    ) {
      throw new Error(
        'The existing draft uses a different Wisconsin contract form.'
      );
    }

    if (offer.listingUid !== this.listingUid || offer.currentVersionUid !== version.Uid || version.status !== 'draft' || offer.status !== 'draft' || version.initiatedByUid !== this.offerService.currentUserUid) {
      throw new Error('This is not your current editable draft version.');
    }
    this.currentOffer.set(offer);
    this.currentVersion.set(version);
    this.property.set(
      version.terms.property
    );
  }


  private flushDraftSave(): Promise<void> {
    if (this.activeSave) {
      return this.activeSave.then(
        () =>
          this.pendingDraftChange
            ? this.flushDraftSave()
            : undefined
      );
    }

    const offer = this.currentOffer();
    const version = this.currentVersion();
    const change = this.pendingDraftChange;

    if (!offer || !version || !change) {
      return Promise.resolve();
    }

    this.pendingDraftChange = null;
    this.saving.set(true);

    const save =
      this.offerService
        .saveDraft<WisconsinOfferTerms>(
          offer.Uid,
          version.Uid,
          {
            terms:
              change.terms,
            expiresAt:
              change.expiresAt,
            ...(
              version.initiatedBy === 'buyer'
                ? {
                  buyers:
                    change.buyers.map(
                      buyer =>
                        this.toOfferVersionPartySnapshot(
                          buyer
                        )
                    ),
                }
                : {}
            ),
            wizardData: {
              stateCode: 'WI',
              contractType:
                change.terms
                  .contractType,
            },
          }
        )
        .catch(error => {
          this.setError(
            error,
            'Your latest Wisconsin offer changes could not be saved.'
          );

          throw error;
        })
        .finally(() => {
          this.activeSave = null;
          this.saving.set(false);
        });

    this.activeSave = save;

    return save;
  }


  private toOfferParties(
    parties:
      readonly OfferVersionPartySnapshot[]
  ): readonly OfferParty[] {
    return parties.map(party => ({
      Uid: party.partyUid,
      role: party.role,
      capacity: party.capacity,
      ...(party.userUid ? { userUid: party.userUid } : {}),
      firstName: party.firstName,
      ...(party.middleName ? { middleName: party.middleName } : {}),
      lastName: party.lastName,
      ...(party.suffix ? { suffix: party.suffix } : {}),
      legalName: party.legalName,
      email: party.email,
      phone: party.phone,
      mailingAddress: party.mailingAddress,
      ...(party.role === 'buyer'
        ? {
          buyerDetails: {
            intendedUse: party.intendedUse ?? 'primary_residence',
            proposedDeedName: party.proposedDeedName ?? party.legalName,
            buyerSequence: party.sequence,
            primaryBuyer: party.primaryParty,
          },
        }
        : {
          sellerDetails: {
            sellerSequence: party.sequence,
            primarySeller: party.primaryParty,
            listingOwner: party.primaryParty,
          },
        }),
      identityVerification: party.identityVerification,
      signature: {
        required: party.requiredSigner,
        status: party.signature.status === 'not_started'
          ? 'not_invited'
          : party.signature.status,
        ...(party.signature.providerEnvelopeUid
          ? { providerEnvelopeUid: party.signature.providerEnvelopeUid }
          : {}),
        ...(party.signature.providerSignerUid
          ? { providerSignerUid: party.signature.providerSignerUid }
          : {}),
      },
      electronicTransactionsConsentAccepted:
        party.electronicTransactionsConsentAccepted,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    }));
  }


  protected async openListingDisclosure(
    disclosure: ListingDisclosureDocument
  ): Promise<void> {
    try {
      await this.listingDisclosureService.openDisclosure(disclosure);
    } catch (error) {
      this.setError(
        error,
        'The seller disclosure could not be opened.'
      );
    }
  }


  private toOfferVersionPartySnapshot(
    party: OfferParty
  ): OfferVersionPartySnapshot {
    return {
      partyUid: party.Uid,
      ...(party.userUid ? { userUid: party.userUid } : {}),
      role: party.role,
      capacity: party.capacity,
      firstName: party.firstName,
      ...(party.middleName ? { middleName: party.middleName } : {}),
      lastName: party.lastName,
      ...(party.suffix ? { suffix: party.suffix } : {}),
      legalName: party.legalName,
      email: party.email,
      phone: party.phone,
      mailingAddress: party.mailingAddress,
      sequence:
        party.buyerDetails?.buyerSequence ??
        party.sellerDetails?.sellerSequence ??
        1,
      primaryParty:
        party.buyerDetails?.primaryBuyer ??
        party.sellerDetails?.primarySeller ??
        false,
      ...(party.buyerDetails
        ? {
          intendedUse: party.buyerDetails.intendedUse,
          proposedDeedName: party.buyerDetails.proposedDeedName,
        }
        : {}),
      requiredSigner: party.signature.required,
      identityVerification: party.identityVerification,
      signature: {
        status: party.signature.status === 'not_invited'
          ? 'not_started'
          : party.signature.status,
        ...(party.signature.providerEnvelopeUid
          ? { providerEnvelopeUid: party.signature.providerEnvelopeUid }
          : {}),
        ...(party.signature.providerSignerUid
          ? { providerSignerUid: party.signature.providerSignerUid }
          : {}),
      },
      electronicTransactionsConsentAccepted:
        party.electronicTransactionsConsentAccepted,
      ...(party.electronicTransactionsConsentAcceptedAt
        ? {
          electronicTransactionsConsentAcceptedAt:
            party.electronicTransactionsConsentAcceptedAt,
        }
        : {}),
    };
  }


  private setError(
    error: unknown,
    fallbackMessage: string
  ): void {
    console.error(
      fallbackMessage,
      error
    );

    this.errorMessage.set(
      error instanceof Error
        ? error.message
        : fallbackMessage
    );
  }
}


function createPropertySnapshot(
  listing: MarketplaceListing
): OfferPropertySnapshot {
  return {
    listingUid:
      listing.uid,

    addressLine1:
      listing.address.addressLine1,

    ...(
      listing.address.addressLine2
        ? {
          addressLine2:
            listing.address.addressLine2,
        }
        : {}
    ),

    city:
      listing.address.city,

    state: 'WI',

    zipCode:
      listing.address.postalCode,

    county:
      listing.address.county ?? '',

    propertyType:
      String(listing.propertyType),

    ...(
      typeof listing.yearBuilt === 'number'
        ? {
          yearBuilt:
            listing.yearBuilt,
        }
        : {}
    ),

    listPriceInCents:
      Math.round(
        listing.price * 100
      ),
  };
}


function createDefaultExpiration(): string {
  return new Date(
    Date.now() +
    DEFAULT_EXPIRATION_HOURS *
    60 *
    60 *
    1000
  ).toISOString();
}


function getWisconsinTimeZone(
  _county: string | undefined
): string {
  return 'America/Chicago';
}


function resolveAttachmentType(
  fieldPath: string
): OfferAttachmentType {
  if (fieldPath.startsWith('addenda.')) {
    return 'contract_addendum';
  }

  const attachmentTypes:
    Readonly<Record<string, OfferAttachmentType>> = {
    'propertyIdentification.legalDescriptionExhibitDocumentUid':
      'legal_description_exhibit',
    'propertyTerms.reservationAddendumDocumentUid':
      'reservation_addendum',
    'leases.residentialLeasesAddendumDocumentUid':
      'residential_lease_addendum',
    'leases.fixtureLeasesAddendumDocumentUid':
      'fixture_lease_addendum',
    'propertyAssociation.associationAddendumDocumentUid':
      'association_addendum',
    'disclosures.propertyCondition.documentUid':
      'property_condition_disclosure',
    'disclosures.leadBasedPaintAddendumDocumentUid':
      'lead_based_paint_addendum',
    'closingAndPossession.temporaryResidentialLeaseDocumentUid':
      'temporary_residential_lease',
    'construction.plansAndSpecificationsDocumentUid':
      'plans_and_specifications',
    'construction.buyerSelectionDocumentsUid':
      'buyer_selection_documents',
    'construction.builderWarrantyDocumentUid':
      'builder_warranty',
    'construction.thirdPartyWarrantyDocumentUid':
      'third_party_warranty',
  };

  const attachmentType =
    attachmentTypes[fieldPath];

  if (!attachmentType) {
    throw new Error(
      'The selected Wisconsin document field is not supported.'
    );
  }

  return attachmentType;
}
