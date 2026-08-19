import { Observable } from 'rxjs';

import {
  ListingSearchFilters,
  ListingSearchResult,
  MarketplaceListingSummary
} from '../models/listing-search-filters.model';

import {
  MarketplaceListing
} from '../models/marketplace-listing.model';

export abstract class MarketplaceListingRepository {
  abstract searchListings(
    filters: ListingSearchFilters
  ): Observable<ListingSearchResult>;

  abstract getListingById(
    listingUid: string
  ): Observable<MarketplaceListing | null>;

  abstract getListingsBySellerId(
    sellerUid: string
  ): Observable<MarketplaceListing[]>;

  abstract getFeaturedListings(
    limit: number
  ): Observable<MarketplaceListingSummary[]>;
}