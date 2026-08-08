import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import {
  AsyncPipe,
  CurrencyPipe,
  DecimalPipe
} from '@angular/common';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import {
  catchError,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap
} from 'rxjs';

import {
  AuthState
} from '../../../../../core/authentication/state/auth.state';

import {
  MarketplaceListing
} from '../../../../../core/domains/marketplace/models/marketplace-listing.model';

import {
  MarketplaceListingRepository
} from '../../../../../core/domains/marketplace/repositories/marketplace-listing.repository';

import {
  FirestoreMarketplaceListingRepository
} from '../../../../../core/domains/marketplace/repositories/firestore-marketplace-listing.repository';

import {
  SavedListingService
} from '../../../../../core/domains/marketplace/services/saved-listing.service';

import {
  ListingGalleryComponent
} from '../../components/listing-gallery/listing-gallery.component';

interface ListingFact {
  label: string;
  value: string;
}

interface ListingDetailsViewModel {
  listing: MarketplaceListing | null;
  facts: ListingFact[];
  hasError: boolean;
}

@Component({
  selector: 'app-listing-details',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DecimalPipe,
    RouterLink,
    ListingGalleryComponent
  ],
  providers: [
    {
      provide: MarketplaceListingRepository,
      useClass: FirestoreMarketplaceListingRepository
    }
  ],
  templateUrl: './listing-details.component.html',
  styleUrl: './listing-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingDetailsComponent
  implements OnInit {

  private readonly route =
    inject(ActivatedRoute);

  private readonly router =
    inject(Router);

  private readonly authState =
    inject(AuthState);

  private readonly listingRepository =
    inject(MarketplaceListingRepository);

  private readonly savedListingService =
    inject(SavedListingService);

  readonly isSaved =
    signal(false);

  readonly isSaving =
    signal(false);

  readonly saveError =
    signal('');

  readonly viewModel$:
    Observable<ListingDetailsViewModel> =
    this.route.paramMap.pipe(
      map(
        params =>
          params.get('listingId') ?? ''
      ),

      switchMap(
        listingId =>
          this.listingRepository
            .getListingById(listingId)
            .pipe(
              map(
                listing => ({
                  listing,

                  facts:
                    listing
                      ? this.createListingFacts(
                        listing
                      )
                      : [],

                  hasError: false
                })
              ),

              catchError(
                () =>
                  of({
                    listing: null,
                    facts: [],
                    hasError: true
                  })
              )
            )
      ),

      shareReplay({
        bufferSize: 1,
        refCount: true
      })
    );

  async ngOnInit(): Promise<void> {
    const userUid =
      this.authState.uid();

    if (!userUid) {
      return;
    }

    const viewModel =
      await firstValueFrom(
        this.viewModel$
      );

    if (!viewModel.listing) {
      return;
    }

    try {
      const saved =
        await this.savedListingService
          .isListingSaved(
            userUid,
            viewModel.listing.uid
          );

      this.isSaved.set(saved);

      const shouldSave =
        this.route.snapshot.queryParamMap.get(
          'saveListing'
        ) === 'true';

      if (
        shouldSave &&
        !saved
      ) {
        await this.saveListing(
          userUid,
          viewModel.listing
        );
      }

      if (shouldSave) {
        await this.router.navigate(
          [],
          {
            relativeTo: this.route,

            queryParams: {
              saveListing: null
            },

            queryParamsHandling: 'merge',
            replaceUrl: true
          }
        );
      }

    } catch (error) {
      console.error(
        'Unable to load saved-listing status.',
        error
      );

      this.saveError.set(
        'We could not load your saved-listing status.'
      );
    }
  }

  async toggleSavedListing(
    listing: MarketplaceListing
  ): Promise<void> {

    if (this.isSaving()) {
      return;
    }

    const userUid =
      this.authState.uid();

    if (!userUid) {
      const returnUrl =
        this.router.createUrlTree(
          [
            '/listings',
            listing.uid
          ],
          {
            queryParams: {
              saveListing: true
            }
          }
        ).toString();

      await this.router.navigate(
        ['/sign-in'],
        {
          queryParams: {
            returnUrl
          }
        }
      );

      return;
    }

    this.isSaving.set(true);
    this.saveError.set('');

    try {
      if (this.isSaved()) {
        await this.savedListingService
          .removeSavedListing(
            userUid,
            listing.uid
          );

        this.isSaved.set(false);

      } else {
        await this.saveListing(
          userUid,
          listing
        );
      }

    } catch (error) {
      console.error(
        'Unable to update saved listing.',
        error
      );

      this.saveError.set(
        'We could not update this saved listing. Please try again.'
      );

    } finally {
      this.isSaving.set(false);
    }
  }

  private async saveListing(
    userUid: string,
    listing: MarketplaceListing
  ): Promise<void> {

    await this.savedListingService
      .saveListing(
        userUid,
        listing
      );

    this.isSaved.set(true);
  }

  private createListingFacts(
    listing: MarketplaceListing
  ): ListingFact[] {

    const facts: ListingFact[] = [];

    if (listing.bedrooms !== undefined) {
      facts.push({
        label: 'Bedrooms',
        value: listing.bedrooms.toString()
      });
    }

    if (listing.bathrooms !== undefined) {
      facts.push({
        label: 'Bathrooms',
        value: listing.bathrooms.toString()
      });
    }

    if (listing.squareFeet !== undefined) {
      facts.push({
        label: 'Square feet',
        value:
          listing.squareFeet.toLocaleString()
      });
    }

    if (listing.lotSizeAcres !== undefined) {
      facts.push({
        label: 'Lot size',
        value:
          `${listing.lotSizeAcres} acres`
      });
    }

    if (listing.yearBuilt !== undefined) {
      facts.push({
        label: 'Year built',
        value:
          listing.yearBuilt.toString()
      });
    }

    facts.push({
      label: 'Property type',
      value:
        this.formatPropertyType(
          listing.propertyType
        )
    });

    return facts;
  }

  private formatPropertyType(
    propertyType:
      MarketplaceListing['propertyType']
  ): string {

    switch (propertyType) {
      case 'single_family':
        return 'Single-family home';

      case 'condominium':
        return 'Condominium';

      case 'townhouse':
        return 'Townhouse';

      case 'multifamily':
        return 'Multifamily';

      case 'manufactured':
        return 'Manufactured home';

      case 'land':
        return 'Land';

      case 'farm':
        return 'Farm';

      case 'other':
      default:
        return 'Other';
    }
  }
}