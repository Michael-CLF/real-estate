import { getOfferBlockingDocumentTypes, checklistDocumentTitle } from '../../../../../core/configuration/listing-document-checklist.config';
import { resolveArizonaPropertyTimeZone } from '../../../../../core/domains/offers/state-contracts/arizona/arizona-property-time-zone';
import { resolveOfferAttachmentType } from '../../../engine/offer-attachment-type';
import { offerExpirationAfterHours } from '../../../engine/offer-expiration';
import { createOfferPropertySnapshot } from '../../../engine/offer-property-snapshot';
import { OfferDraftSaveQueue } from '../../../engine/services/offer-draft-save-queue';
import { input } from '@angular/core';
import { OfferWorkflowService } from '../../../engine/services/offer-workflow.service';
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
  ArizonaOfferTerms,
} from '../../../../../core/domains/offers/state-contracts/arizona/models/arizona-offer-terms.model';

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
  ArizonaOfferDraftChange,
} from '../offer-wizard/offer-wizard.component';


const DEFAULT_EXPIRATION_HOURS = 48;


@Component({
  selector:
    'app-arizona-offer-entry',

  standalone: true,

  imports: [
    OfferWizardComponent,
  ],

  providers: [
    OfferWorkflowService,
    {
      provide:
        MarketplaceListingRepository,

      useClass:
        FirestoreMarketplaceListingRepository,
    },
  ],

  templateUrl:
    './arizona-offer-entry.component.html',

  styleUrl:
    './arizona-offer-entry.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ArizonaOfferEntryComponent
  implements OnInit {
  readonly listingContext = input<MarketplaceListing | null>(null);

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
    signal<OfferVersion<ArizonaOfferTerms> | null>(null);

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
        resolveArizonaPropertyTimeZone(this.property()?.county)
    );

  protected readonly busy =
    computed(
      () =>
        this.creating() ||
        this.uploading() ||
        this.submitting()
    );

  private readonly draftSaveQueue = new OfferDraftSaveQueue<ArizonaOfferDraftChange>();

  private get pendingDraftChange(): ArizonaOfferDraftChange | null {
    return this.draftSaveQueue.pendingDraftChange;
  }

  private set pendingDraftChange(change: ArizonaOfferDraftChange | null) {
    this.draftSaveQueue.pendingDraftChange = change;
  }

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
        await this.workflow.loadListing(this.listingUid, this.listingRepository, this.listingContext());

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

      if (stateCode !== 'AZ') {
        throw new Error(
          'The Arizona offer process can only be used for property located in Arizona.'
        );
      }

      if (!['single_family', 'townhome', 'pud'].includes(String(listing.propertyType))) {
        throw new Error('This Arizona agreement supports residential resales. Condominiums, vacant land, and other property types need their own agreement.');
      }

      resolveArizonaPropertyTimeZone(createPropertySnapshot(listing).county);
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

      const requiredDocuments = getOfferBlockingDocumentTypes('AZ', {
        ...listing.sellerStatements, yearBuilt: listing.yearBuilt, propertyType: listing.propertyType,
      });
      const missingDocuments = requiredDocuments.filter(type => !this.listingDisclosures().some(document =>
        document.documentType === type && document.listingUid === this.listingUid &&
        document.stateAbbreviation === 'AZ' && Boolean(document.storagePath) && Boolean(document.versionId),
      ));
      if (missingDocuments.length) {
        this.property.set(null);
        throw new Error('The seller must upload the required Arizona documents before an offer can be opened: ' +
          missingDocuments.map(type => checklistDocumentTitle('AZ', type)).join(', ') + '.');
      }

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
          'navstreet_arizona_residential_sale_2026'
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
        'The Arizona offer process could not be opened.'
      );
    } finally {
      this.loading.set(false);
    }
  }


  private async createInitialDraft(): Promise<void> {
    if (
      (this.busy() || this.saving()) ||
      this.currentVersion()
    ) {
      return;
    }

    this.creating.set(true);
    this.errorMessage.set('');

    try {
      await this.workflow.createAndLoadDraft(
        this.listingUid,
        'navstreet_arizona_residential_sale_2026',
        (offerUid, versionUid, contractType) =>
          this.loadOfferSession(offerUid, versionUid, contractType),
      );
    } catch (error) {
      this.setError(
        error,
        'The Arizona offer draft could not be created.'
      );
    } finally {
      this.creating.set(false);
    }
  }


  protected onDraftChanged(
    change: ArizonaOfferDraftChange
  ): void {
    if (
      !this.currentOffer() ||
      !this.currentVersion()
    ) {
      return;
    }

    this.pendingDraftChange = change;
    void this.flushDraftSave().catch(() => undefined);
  }


  protected async onDocumentSelected(
    selection: OfferDocumentSelection
  ): Promise<void> {
    const offer = this.currentOffer();
    const version = this.currentVersion();

    if (
      !offer ||
      !version ||
      (this.busy() || this.saving())
    ) {
      return;
    }

    this.uploading.set(true);
    this.errorMessage.set('');

    try {
      await this.workflow.uploadAndSaveAttachment(
        () => this.offerDocumentService.uploadAttachment(
          offer.Uid,
          version.Uid,
          resolveAttachmentType(selection.fieldPath),
          selection.file,
        ),
        documentUid => this.wizard()?.applyDocumentUid(selection.fieldPath, documentUid),
        () => this.flushDraftSave(),
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
    change: ArizonaOfferDraftChange
  ): Promise<void> {
    const offer = this.currentOffer();
    const version = this.currentVersion();
    if (!offer || !version || this.busy()) return;
    this.pendingDraftChange = change;
    this.submitting.set(true);
    this.errorMessage.set('');
    try {
      await this.workflow.saveAndSubmit(
        () => this.flushDraftSave(), offer.Uid, version.Uid, version.versionNumber,
      );
    } catch (error) {
      this.setError(error, 'The offer could not be completed. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }


  protected async returnToListing():
    Promise<void> {
    await this.workflow.saveAndReturnToListing(
      () => this.flushDraftSave(), this.listingUid,
    );
  }


  private async resumeExistingDraft():
    Promise<void> {
    const existingOffer = await this.workflow.findResumableDraft(this.listingUid, this.offerRepository);
    if (!existingOffer) return;

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
      await this.workflow.loadValidatedOfferVersion<ArizonaOfferTerms>(
        offerUid, offerVersionUid, 'AZ', 'Arizona', expectedContractType
      );

    this.workflow.assertCurrentEditableDraft(offer, version, this.listingUid);
    this.currentOffer.set(offer);
    this.currentVersion.set(version);
    this.property.set(
      version.terms.property
    );
  }


  private readonly workflow = inject(OfferWorkflowService);

  private flushDraftSave(): Promise<void> {
    return this.draftSaveQueue.flush(
      change => {
        const offer = this.currentOffer();
        const version = this.currentVersion();
        if (!offer || !version) return null;
        const payload = this.workflow.buildDraftChanges(
          'AZ', change, version.initiatedBy === 'buyer',
        );
        return () => this.workflow.saveDraft(offer.Uid, version.Uid, payload);
      },
      saving => this.saving.set(saving),
      error => this.setError(error, 'Your latest offer changes could not be saved. Please try again.'),
    );
  }


  private toOfferParties(
    parties:
      readonly OfferVersionPartySnapshot[]
  ): readonly OfferParty[] {
    return this.workflow.toOfferParties(parties);
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
    return this.workflow.toOfferVersionPartySnapshot(party);
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
  return createOfferPropertySnapshot(listing, 'AZ');
}


function createDefaultExpiration(): string {
  return offerExpirationAfterHours(DEFAULT_EXPIRATION_HOURS);
}



function getArizonaTimeZone(
  _county: string | undefined
): string {
  return resolveArizonaPropertyTimeZone(_county);
}


function resolveAttachmentType(
  fieldPath: string
): OfferAttachmentType {
  return resolveOfferAttachmentType(fieldPath, 'The selected Arizona document field is not supported.', false);
}
