import { ListingSearchFilters, ListingSearchResult, MarketplaceListingSummary } from './models/listing-search-filters.model';
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

export function getPrerenderedMarketplaceResult(filters: ListingSearchFilters): ListingSearchResult {
  const listings: MarketplaceListingSummary[] = publicListings.map(item => ({
    id: item.id,
    sellerUid: '',
    title: item.title,
    propertyType: item.propertyType as MarketplaceListingSummary['propertyType'],
    status: item.status as MarketplaceListingSummary['status'],
    price: item.price,
    featuredListing: item.featuredListing,
    ...(item.bedrooms !== null ? { bedrooms: item.bedrooms } : {}),
    ...(item.bathrooms !== null ? { bathrooms: item.bathrooms } : {}),
    ...(item.squareFeet !== null ? { squareFeet: item.squareFeet } : {}),
    city: item.city,
    stateAbbreviation: item.stateAbbreviation,
    postalCode: item.postalCode,
    ...(item.featuredPhotoUrl ? { featuredPhotoUrl: item.featuredPhotoUrl } : {}),
    favoriteCount: 0,
    viewCount: 0,
    inquiryCount: 0,
    ...(item.publishedAt ? { publishedAt: new Date(item.publishedAt) } : {})
  }));
  const pageSize = filters.pageSize ?? 12;
  return {
    listings: listings.slice(0, pageSize),
    totalCount: listings.length,
    page: 1,
    pageSize,
    totalPages: Math.max(1, Math.ceil(listings.length / pageSize))
  };
}
