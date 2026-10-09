import { input } from '@angular/core';
import type { MarketplaceListing } from '../../../../../core/domains/marketplace/models/marketplace-listing.model';
import { OfferWorkflowService } from '../../../engine/services/offer-workflow.service';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AccountState } from '../../../../../core/authentication/state/account.state';
import { MarketplaceListingRepository } from '../../../../../core/domains/marketplace/repositories/marketplace-listing.repository';
import { FirestoreMarketplaceListingRepository } from '../../../../../core/domains/marketplace/repositories/firestore-marketplace-listing.repository';
import { OfferVersion } from '../../../../../core/domains/offers/models/offer-version.model';
import { OfferService } from '../../../../../core/domains/offers/services/offer.service';
import { OfferWizardComponent, NorthCarolinaOfferSession } from '../offer-wizard/offer-wizard.component';

@Component({
  selector: 'app-north-carolina-offer-entry',
  standalone: true,
  imports: [OfferWizardComponent],
  providers: [OfferWorkflowService, { provide: MarketplaceListingRepository, useClass: FirestoreMarketplaceListingRepository }],
  templateUrl: './north-carolina-offer-entry.component.html',
  styleUrl: './north-carolina-offer-entry.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NorthCarolinaOfferEntryComponent implements OnInit {
  readonly listingContext = input<MarketplaceListing | null>(null);

  private readonly workflow = inject(OfferWorkflowService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountState = inject(AccountState);
  private readonly offerService = inject(OfferService);
  private readonly listingRepository = inject(MarketplaceListingRepository);
  readonly session = signal<NorthCarolinaOfferSession | null>(null);
  readonly errorMessage = signal('');
  readonly listingUid = this.route.snapshot.paramMap.get('listingUid') ?? this.route.snapshot.paramMap.get('id') ?? '';
  private offerUid = '';
  private offerVersionUid = '';

  async ngOnInit(): Promise<void> {
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

      const requestedOfferUid =
        this.route.snapshot
          .queryParamMap
          .get('offerUid');

      const requestedOfferVersionUid =
        this.route.snapshot
          .queryParamMap
          .get('offerVersionUid');

      if (
        !!requestedOfferUid !==
        !!requestedOfferVersionUid
      ) {
        throw new Error(
          'Both the offer and offer-version identifiers are required to open a counteroffer draft.'
        );
      }

      let offerVersion:
        OfferVersion | null;

      if (
        requestedOfferUid &&
        requestedOfferVersionUid
      ) {
        const requestedOffer =
          await this.offerService.getOffer(
            requestedOfferUid
          );

        if (
          !requestedOffer ||
          requestedOffer.listingUid !==
            this.listingUid ||
          requestedOffer.currentVersionUid !==
            requestedOfferVersionUid
        ) {
          throw new Error(
            'The requested counteroffer draft is not the current version for this property.'
          );
        }

        offerVersion =
          await this.offerService.getVersion(
            requestedOfferUid,
            requestedOfferVersionUid
          );

        if (
          !offerVersion ||
          !this.offerService
            .getParticipantAccess(
              requestedOffer,
              offerVersion
            )
            .canEditCurrentDraft
        ) {
          throw new Error(
            'You do not have permission to edit this counteroffer draft.'
          );
        }

        this.offerUid =
          requestedOfferUid;

        this.offerVersionUid =
          requestedOfferVersionUid;
      } else {
        const draftResult =
          await this.offerService
            .createOrResumeDraft(
              this.listingUid
            );

        this.offerUid =
          draftResult.offerUid;

        this.offerVersionUid =
          draftResult.offerVersionUid;

        offerVersion =
          await this.offerService.getVersion(
            this.offerUid,
            this.offerVersionUid
          );
      }

      const listing =
        await this.workflow.loadListing(this.listingUid, this.listingRepository, this.listingContext());

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

      if (offerVersion.stateCode !== 'NC') {
        throw new Error('The requested offer is not a North Carolina agreement.');
      }
      this.session.set({
        listingUid: this.listingUid,
        offerUid: this.offerUid,
        offerVersionUid: this.offerVersionUid,
        offerVersion,
        profile,
        propertyCounty: listing.address.county ?? '',
        saveDraft: changes => this.workflow.saveDraft(this.offerUid, this.offerVersionUid, changes),
        submitOffer: () => this.workflow.submitAndPrepareAgreement(this.offerUid, this.offerVersionUid, offerVersion.versionNumber),
        returnToListing: async () => { await this.router.navigate(['/listings', this.listingUid]); },
      });
    } catch (error: unknown) {
      this.errorMessage.set(error instanceof Error ? error.message : 'The offer could not be opened.');
    }
  }

  returnToListing(): void {
    void this.router.navigate(this.listingUid ? ['/listings', this.listingUid] : ['/']);
  }
}
