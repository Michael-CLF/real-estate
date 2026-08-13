import { ListingStatus } from '../../listings/models/listing-status.type';
import { PropertyType } from '../../property/models/property-type.type';

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
  sellerUid: string;

  title: string;
  propertyType: PropertyType;
  status: ListingStatus;

  price: number;
  originalPrice?: number;
  featuredListing: boolean;

  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;

  city: string;
  stateAbbreviation: string;
  postalCode: string;

  featuredPhotoUrl?: string;

  favoriteCount: number;
  viewCount: number;
  inquiryCount: number;

  publishedAt?: Date;
}