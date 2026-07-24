import { ListingStatus } from './listing-status.type';
import { PropertyType } from './property-type.type';

export type ListingSortOption =
  | 'newest'
  | 'price_low_to_high'
  | 'price_high_to_low'
  | 'bedrooms_high_to_low'
  | 'square_feet_high_to_low';

export interface ListingSearchFilters {
  searchTerm?: string;

  state?: string;
  stateSlug?: string;
  city?: string;
  postalCode?: string;
  county?: string;

  propertyTypes?: PropertyType[];

  minimumPrice?: number;
  maximumPrice?: number;

  minimumBedrooms?: number;
  minimumBathrooms?: number;
  minimumSquareFeet?: number;

  listingStatuses?: ListingStatus[];

  sort?: ListingSortOption;

  page?: number;
  pageSize?: number;
}

export interface ListingSearchResult {
  listings: MarketplaceListingSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface MarketplaceListingSummary {
  id: string;
  sellerId: string;

  title: string;
  propertyType: PropertyType;

  price: number;

  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;

  city: string;
  stateAbbreviation: string;
  postalCode: string;

  featuredPhotoUrl?: string;

  favoriteCount: number;

  publishedAt?: Date;
}