import {
  ChangeDetectionStrategy,
  Component,
  inject,
  afterNextRender
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { getPrerenderedMarketplaceResult } from '../../../../../core/domains/marketplace/prerendered-marketplace-listings';
import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';
import {
  catchError,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap
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
  FirestoreMarketplaceListingRepository
} from '../../../../../core/domains/marketplace/repositories/firestore-marketplace-listing.repository';
import {
  ListingCardComponent
} from '../../components/listing-card/listing-card.component';
import {
  SearchFilterBarComponent
} from '../../components/search-filter-bar/search-filter-bar.component';
import {
  PropertyType
} from '../../../../../core/domains/property/models/property-type.type';
import {
  PageSeoService
} from '../../../../../core/seo/page-seo.service';

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
    RouterLink,
    ListingCardComponent,
    SearchFilterBarComponent
  ],
  providers: [
    {
      provide: MarketplaceListingRepository,
      useClass: FirestoreMarketplaceListingRepository
    }
  ],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SearchResultsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageSeo =
    inject(PageSeoService);
  private readonly listingRepository = inject(
    MarketplaceListingRepository
  );

  private readonly browserRefresh = new BehaviorSubject(false);

  constructor() {
    // Keep the prerendered card tree identical during hydration.
    // Fetch current Firestore results only after browser rendering begins.
    afterNextRender(() => this.browserRefresh.next(true));
  }

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
    combineLatest([this.route.queryParamMap, this.route.paramMap, this.browserRefresh]).pipe(
      map(([queryParams, routeParams, refreshed]) => {
        const filters: ListingSearchFilters = {
          searchTerm:
            queryParams.get('query')?.trim() || undefined,

          // No default state: opening Homes must show listings
          // from every state.
          stateSlug:
            queryParams.get('state')?.trim() || undefined,

          // Retained temporarily for old bookmarked URLs.
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
            queryParams.get('page') ?? routeParams.get('pageNumber'),
            1
          ),

          pageSize: 12
        };

        return { filters, refreshed };
      }),

      switchMap(({ filters, refreshed }) =>
        (refreshed || !this.canUsePrerenderedResult(filters)
          ? this.listingRepository.searchListings(filters)
          : of(getPrerenderedMarketplaceResult(filters))
        ).pipe(
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

     tap(viewModel => {
  const filters = viewModel.filters;

  const hasAdditionalFilters = Boolean(
    filters.searchTerm ||
    filters.city ||
    filters.postalCode ||
    filters.propertyTypes?.length ||
    filters.minimumPrice != null ||
    filters.maximumPrice != null ||
    filters.minimumBedrooms != null ||
    filters.minimumBathrooms != null
  );

  if (filters.stateSlug && !hasAdditionalFilters) {
    const stateName = this.stateNameFromSlug(
      filters.stateSlug
    );

    this.pageSeo.set(
      `${stateName} FSBO Homes for Sale | NavStreet`,
      `Browse ${stateName} for-sale-by-owner homes on NavStreet. Explore property photos, prices, and details, and connect directly with sellers.`
    );

  } else if (!filters.stateSlug && !hasAdditionalFilters) {
    this.pageSeo.set(
      (filters.page ?? 1) > 1
        ? `For Sale By Owner Homes — Page ${filters.page} | NavStreet`
        : 'For Sale By Owner Homes for Sale | NavStreet',
      'Explore for-sale-by-owner homes across the United States. Browse property photos, prices, and details on NavStreet.'
    );

  } else {
    this.pageSeo.set(
      `${viewModel.heading} | NavStreet`,
      'Browse for-sale-by-owner homes, photos, prices, and property details on NavStreet.'
    );
  }
}),

      shareReplay({
        bufferSize: 1,
        refCount: true
      })
    );

  private canUsePrerenderedResult(filters: ListingSearchFilters): boolean {
    return !filters.searchTerm && !filters.stateSlug &&
      !filters.city && !filters.postalCode &&
      !filters.propertyTypes?.length &&
      filters.minimumPrice === undefined &&
      filters.maximumPrice === undefined &&
      filters.minimumBedrooms === undefined &&
      filters.minimumBathrooms === undefined &&
      (filters.sort ?? 'newest') === 'newest' &&
      (filters.page ?? 1) >= 1;
  }

  isUnfilteredPagination(filters: ListingSearchFilters): boolean {
    return !filters.searchTerm && !filters.stateSlug &&
      !filters.city && !filters.postalCode &&
      !filters.propertyTypes?.length &&
      filters.minimumPrice === undefined &&
      filters.maximumPrice === undefined &&
      filters.minimumBedrooms === undefined &&
      filters.minimumBathrooms === undefined &&
      (filters.sort ?? 'newest') === 'newest';
  }

  crawlablePageUrl(page: number): string {
    return page <= 1 ? '/homes/' : `/homes/page/${page}/`;
  }

  onSortChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const sort = this.parseSortOption(selectElement.value);

    void this.router.navigate(['/homes'], {
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
      case 'condo':
      case 'townhome':
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
    const location = [
      filters.city ||
      filters.postalCode ||
      filters.searchTerm,
      filters.stateSlug
        ? this.stateNameFromSlug(filters.stateSlug)
        : ''
    ]
      .filter(Boolean)
      .join(', ');

    return location
      ? `For Sale by Owner Properties in ${location}`
      : 'For Sale by Owner Properties';
  }

  private stateNameFromSlug(stateSlug: string): string {
    return stateSlug
      .split('-')
      .map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      )
      .join(' ');
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
