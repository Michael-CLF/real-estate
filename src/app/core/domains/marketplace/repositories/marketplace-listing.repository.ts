import { Observable } from 'rxjs';

import {
  ListingSearchFilters,
  ListingSearchResult
} from '../models/listing-search-filters.model';
import { MarketplaceListing } from '../models/marketplace-listing.model';

export abstract class MarketplaceListingRepository {
  abstract searchListings(
    filters: ListingSearchFilters
  ): Observable<ListingSearchResult>;

  abstract getListingById(
    listingId: string
  ): Observable<MarketplaceListing | null>;

  abstract getListingsBySellerId(
    sellerId: string
  ): Observable<MarketplaceListing[]>;

  abstract getFeaturedListings(
    limit: number
  ): Observable<MarketplaceListing[]>;
}