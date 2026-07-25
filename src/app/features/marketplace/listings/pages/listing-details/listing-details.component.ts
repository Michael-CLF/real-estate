import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';
import {
  AsyncPipe,
  CurrencyPipe,
  DecimalPipe
} from '@angular/common';
import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';
import {
  catchError,
  map,
  Observable,
  of,
  shareReplay,
  switchMap
} from 'rxjs';

import {
  MarketplaceListing
} from '../../../../../core/domains/marketplace/models/marketplace-listing.model';
import {
  MarketplaceListingRepository
} from '../../../../../core/domains/marketplace/repositories/marketplace-listing.repository';
import {
  MockMarketplaceListingRepository
} from '../../../../../core/domains/marketplace/repositories/mock-marketplace-listing.repository';
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
      useClass: MockMarketplaceListingRepository
    }
  ],
  templateUrl: './listing-details.component.html',
  styleUrl: './listing-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly listingRepository = inject(
    MarketplaceListingRepository
  );

  readonly viewModel$: Observable<ListingDetailsViewModel> =
    this.route.paramMap.pipe(
      map(params => params.get('listingId') ?? ''),
      switchMap(listingId =>
        this.listingRepository
          .getListingById(listingId)
          .pipe(
            map(listing => ({
              listing,
              facts: listing
                ? this.createListingFacts(listing)
                : [],
              hasError: false
            })),
            catchError(() =>
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
        value: listing.squareFeet.toLocaleString()
      });
    }

    if (listing.lotSizeAcres !== undefined) {
      facts.push({
        label: 'Lot size',
        value: `${listing.lotSizeAcres} acres`
      });
    }

    if (listing.yearBuilt !== undefined) {
      facts.push({
        label: 'Year built',
        value: listing.yearBuilt.toString()
      });
    }

    facts.push({
      label: 'Property type',
      value: this.formatPropertyType(
        listing.propertyType
      )
    });

    return facts;
  }

  private formatPropertyType(
    propertyType: MarketplaceListing['propertyType']
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