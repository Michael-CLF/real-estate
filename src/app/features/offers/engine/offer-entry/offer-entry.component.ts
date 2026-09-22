import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Type,
  inject,
  signal,
} from '@angular/core';

import {
  NgComponentOutlet,
} from '@angular/common';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  firstValueFrom,
} from 'rxjs';

import {
  MarketplaceListingRepository,
} from '../../../../core/domains/marketplace/repositories/marketplace-listing.repository';

import {
  FirestoreMarketplaceListingRepository,
} from '../../../../core/domains/marketplace/repositories/firestore-marketplace-listing.repository';

import {
  getEnabledStateOfferRegistration,
} from '../state-offer-registry';


@Component({
  selector:
    'app-offer-entry',

  standalone: true,

  imports: [
    NgComponentOutlet,
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
    './offer-entry.component.html',

  styleUrl:
    './offer-entry.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class OfferEntryComponent
implements OnInit {
  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly listingRepository =
    inject(MarketplaceListingRepository);

  readonly loading =
    signal(true);

  readonly errorMessage =
    signal('');

  readonly offerComponent =
    signal<Type<unknown> | null>(
      null
    );

  readonly listingUid =
    this.route.snapshot.paramMap.get(
      'listingUid'
    ) ?? '';


  async ngOnInit(): Promise<void> {
    try {
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

      const stateRegistration =
        getEnabledStateOfferRegistration(
          stateCode
        );

      if (!stateRegistration) {
        throw new Error(
          `NavStreet offers are not yet available in ${stateCode || 'this state'}.`
        );
      }

      const component =
        await stateRegistration
          .loadComponent();

      this.offerComponent.set(
        component
      );
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error
          ? error.message
          : 'The offer process could not be opened.'
      );
    } finally {
      this.loading.set(false);
    }
  }


  returnToListing(): void {
    if (!this.listingUid) {
      void this.router.navigate([
        '/',
      ]);

      return;
    }

    void this.router.navigate([
      '/listings',
      this.listingUid,
    ]);
  }
}
