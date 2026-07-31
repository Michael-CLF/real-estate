import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import {
  ActivatedRoute,
  Router
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
  ListingSearchFilters,
  ListingSearchResult,
  ListingSortOption
} from '../../../../../core/domains/marketplace/models/listing-search-filters.model';
import {
  MarketplaceListingRepository
} from '../../../../../core/domains/marketplace/repositories/marketplace-listing.repository';
import {
  MockMarketplaceListingRepository
} from '../../../../../core/domains/marketplace/repositories/mock-marketplace-listing.repository';
import {
  ListingCardComponent
} from '../../components/listing-card/listing-card.component';
import {
  SearchFilterBarComponent
} from '../../components/search-filter-bar/search-filter-bar.component';
import {
  PropertyType
} from '../../../../../core/domains/property/models/property-type.type';

interface SearchResultsViewModel {
  result: ListingSearchResult;
  filters: ListingSearchFilters;
  heading: string;
  hasError: boolean;
}

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    AsyncPipe,
    ListingCardComponent,
    SearchFilterBarComponent
  ],
  providers: [
    {
      provide: MarketplaceListingRepository,
      useClass: MockMarketplaceListingRepository
    }
  ],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly listingRepository = inject(
    MarketplaceListingRepository
  );

  readonly sortOptions: ReadonlyArray<{
    label: string;
    value: ListingSortOption;
  }> = [
      {
        label: 'Newest listings',
        value: 'newest'
      },
      {
        label: 'Price: Low to high',
        value: 'price_low_to_high'
      },
      {
        label: 'Price: High to low',
        value: 'price_high_to_low'
      },
      {
        label: 'Most bedrooms',
        value: 'bedrooms_high_to_low'
      },
      {
        label: 'Largest square footage',
        value: 'square_feet_high_to_low'
      }
    ];

  readonly viewModel$: Observable<SearchResultsViewModel> =
    this.route.queryParamMap.pipe(
      map(queryParams => {
        const filters: ListingSearchFilters = {
          searchTerm:
            queryParams.get('query')?.trim() || undefined,

          stateSlug:
            queryParams.get('state')?.trim() ||
            'north-carolina',

          city:
            queryParams.get('city')?.trim() || undefined,

          postalCode:
            queryParams.get('postalCode')?.trim() || undefined,

          propertyTypes: this.parsePropertyTypes(
            queryParams.get('propertyType')
          ),

          minimumPrice: this.parseOptionalNumber(
            queryParams.get('minimumPrice')
          ),

          maximumPrice: this.parseOptionalNumber(
            queryParams.get('maximumPrice')
          ),

          minimumBedrooms: this.parseOptionalNumber(
            queryParams.get('minimumBedrooms')
          ),

          minimumBathrooms: this.parseOptionalNumber(
            queryParams.get('minimumBathrooms')
          ),

          sort: this.parseSortOption(
            queryParams.get('sort')
          ),

          page: this.parsePositiveInteger(
            queryParams.get('page'),
            1
          ),

          pageSize: 12
        };

        return filters;
      }),
      switchMap(filters =>
        this.listingRepository.searchListings(filters).pipe(
          map(result => ({
            result,
            filters,
            heading: this.createPageHeading(filters),
            hasError: false
          })),
          catchError(() =>
            of({
              result: this.createEmptyResult(filters),
              filters,
              heading: this.createPageHeading(filters),
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

  onSortChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const sort = this.parseSortOption(selectElement.value);

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort,
        page: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  goToPreviousPage(currentPage: number): void {
    this.updatePage(Math.max(currentPage - 1, 1));
  }

  goToNextPage(
    currentPage: number,
    totalPages: number
  ): void {
    this.updatePage(
      Math.min(currentPage + 1, totalPages)
    );
  }

  private updatePage(page: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page
      },
      queryParamsHandling: 'merge'
    });
  }

  private parsePropertyTypes(
  value: string | null
): PropertyType[] | undefined {
  switch (value) {
    case 'single_family':
    case 'condominium':
    case 'townhouse':
    case 'multifamily':
    case 'manufactured':
    case 'land':
    case 'farm':
    case 'other':
      return [value];

    default:
      return undefined;
  }
}

  private createPageHeading(
    filters: ListingSearchFilters
  ): string {
    if (filters.city) {
      return `Homes for sale in ${filters.city}`;
    }

    if (filters.postalCode) {
      return `Homes for sale in ${filters.postalCode}`;
    }

    if (filters.stateSlug === 'north-carolina') {
      return 'Homes for sale in North Carolina';
    }

    return 'Homes for sale';
  }

  private createEmptyResult(
    filters: ListingSearchFilters
  ): ListingSearchResult {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 12;

    return {
      listings: [],
      totalCount: 0,
      page,
      pageSize,
      totalPages: 1
    };
  }

  private parseOptionalNumber(
    value: string | null
  ): number | undefined {
    if (!value?.trim()) {
      return undefined;
    }

    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : undefined;
  }

  private parsePositiveInteger(
    value: string | null,
    fallback: number
  ): number {
    const parsedValue = Number(value);

    if (
      !Number.isInteger(parsedValue) ||
      parsedValue < 1
    ) {
      return fallback;
    }

    return parsedValue;
  }

  private parseSortOption(
    value: string | null
  ): ListingSortOption {
    switch (value) {
      case 'price_low_to_high':
      case 'price_high_to_low':
      case 'bedrooms_high_to_low':
      case 'square_feet_high_to_low':
      case 'newest':
        return value;

      default:
        return 'newest';
    }
  }
}