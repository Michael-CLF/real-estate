import {
  ListingSearchFilters,
  ListingSearchResult,
  MarketplaceListingSummary
} from './models/listing-search-filters.model';

import { STATES } from '../../configuration/states.config';
import snapshot from './public-listings.snapshot.json';

/** Public-only build snapshot. Never contains seller contact information. */
interface PublicListing {
  id: string;
  title: string;
  propertyType: string;
  status: string;
  price: number;
  featuredListing: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  city: string;
  stateAbbreviation: string;
  postalCode: string;
  featuredPhotoUrl: string | null;
  publishedAt: string | null;
}

const publicListings = snapshot.listings as PublicListing[];

const stateByAbbreviation = new Map(
  STATES.map(state => [
    state.abbreviation.toUpperCase(),
    state
  ])
);

export function getPrerenderedMarketplaceResult(
  filters: ListingSearchFilters
): ListingSearchResult {

  let listings: MarketplaceListingSummary[] = publicListings
    .filter(item =>
      ['active', 'under_contract', 'sold'].includes(item.status)
    )
    .map(item => ({
      id: item.id,
      sellerUid: '',
      title: item.title,
      propertyType:
        item.propertyType as MarketplaceListingSummary['propertyType'],
      status:
        item.status as MarketplaceListingSummary['status'],
      price: item.price,
      featuredListing: item.featuredListing,

      ...(item.bedrooms !== null
        ? { bedrooms: item.bedrooms }
        : {}),

      ...(item.bathrooms !== null
        ? { bathrooms: item.bathrooms }
        : {}),

      ...(item.squareFeet !== null
        ? { squareFeet: item.squareFeet }
        : {}),

      city: item.city,
      stateAbbreviation: item.stateAbbreviation,
      postalCode: item.postalCode,

      ...(item.featuredPhotoUrl
        ? { featuredPhotoUrl: item.featuredPhotoUrl }
        : {}),

      favoriteCount: 0,
      viewCount: 0,
      inquiryCount: 0,

      ...(item.publishedAt
        ? { publishedAt: new Date(item.publishedAt) }
        : {})
    }));

  // Listing status
  if (filters.listingStatuses?.length) {
    listings = listings.filter(listing =>
      filters.listingStatuses!.includes(listing.status)
    );
  }

  // State
  if (filters.stateSlug) {
    const stateSlug = filters.stateSlug.trim().toLowerCase();

    listings = listings.filter(listing =>
      stateByAbbreviation.get(
        listing.stateAbbreviation.toUpperCase()
      )?.slug === stateSlug
    );
  }

  // General location search
  if (filters.searchTerm) {
    const searchTerm = filters.searchTerm.trim().toLowerCase();

    listings = listings.filter(listing => {
      const state = stateByAbbreviation.get(
        listing.stateAbbreviation.toUpperCase()
      );

      const searchableText = [
        listing.title,
        listing.city,
        listing.stateAbbreviation,
        state?.name ?? '',
        state?.slug ?? '',
        listing.postalCode
      ].join(' ').toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }

  // City
  if (filters.city) {
    const city = filters.city.trim().toLowerCase();

    listings = listings.filter(listing =>
      listing.city.trim().toLowerCase() === city
    );
  }

  // ZIP code
  if (filters.postalCode) {
    const postalCode = filters.postalCode.trim();

    listings = listings.filter(listing =>
      listing.postalCode === postalCode
    );
  }

  // Property type
  if (filters.propertyTypes?.length) {
    listings = listings.filter(listing =>
      filters.propertyTypes!.includes(listing.propertyType)
    );
  }

  // Minimum price
  if (filters.minimumPrice !== undefined) {
    listings = listings.filter(listing =>
      listing.price >= filters.minimumPrice!
    );
  }

  // Maximum price
  if (filters.maximumPrice !== undefined) {
    listings = listings.filter(listing =>
      listing.price <= filters.maximumPrice!
    );
  }

  // Bedrooms
  if (filters.minimumBedrooms !== undefined) {
    listings = listings.filter(listing =>
      (listing.bedrooms ?? 0) >= filters.minimumBedrooms!
    );
  }

  // Bathrooms
  if (filters.minimumBathrooms !== undefined) {
    listings = listings.filter(listing =>
      (listing.bathrooms ?? 0) >= filters.minimumBathrooms!
    );
  }

  // Square footage
  if (filters.minimumSquareFeet !== undefined) {
    listings = listings.filter(listing =>
      (listing.squareFeet ?? 0) >= filters.minimumSquareFeet!
    );
  }

  // Sorting
  switch (filters.sort ?? 'newest') {
    case 'price_low_to_high':
      listings.sort((a, b) => a.price - b.price);
      break;

    case 'price_high_to_low':
      listings.sort((a, b) => b.price - a.price);
      break;

    case 'bedrooms_high_to_low':
      listings.sort(
        (a, b) => (b.bedrooms ?? 0) - (a.bedrooms ?? 0)
      );
      break;

    case 'square_feet_high_to_low':
      listings.sort(
        (a, b) => (b.squareFeet ?? 0) - (a.squareFeet ?? 0)
      );
      break;

    case 'newest':
    default:
      // Preserve the existing build snapshot ordering.
      break;
  }

  // Pagination
  const pageSize = Math.max(1, filters.pageSize ?? 12);
  const totalCount = listings.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / pageSize)
  );

  const page = Math.min(
    Math.max(1, filters.page ?? 1),
    totalPages
  );

  return {
    listings: listings.slice(
      (page - 1) * pageSize,
      page * pageSize
    ),
    totalCount,
    page,
    pageSize,
    totalPages
  };
}