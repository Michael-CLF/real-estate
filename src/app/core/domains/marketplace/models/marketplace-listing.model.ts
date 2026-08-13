import { ListingPhoto } from '../../listings/models/listing-photo.model';
import { ListingStatus } from '../../listings/models/listing-status.type';
import { PropertyType } from '../../property/models/property-type.type';
import {
  ListingEnhancements,
  ListingHoa,
  ListingSchools,
  LotSizeUnit
} from '../../listings/models/listing.model';


export interface ListingAddress {
  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  stateAbbreviation: string;
  stateSlug: string;

  postalCode: string;
  county?: string;
}

export interface ListingLocation {
  latitude: number;
  longitude: number;
  geohash?: string;
}

export interface MarketplaceListing {
  uid: string;
  sellerUid: string;

  status: ListingStatus;
  propertyType: PropertyType;

  title: string;
  description: string;

  price: number;
  originalPrice?: number;
  featuredListing: boolean;

  bedrooms?: number;
  bathrooms?: number;

  squareFeet?: number;

  /*
   * Generic lot-size fields used by current listings.
   */
  lotSize?: number;
  lotSizeUnit?: LotSizeUnit;

  /*
   * Retained for compatibility with existing marketplace code
   * and older listings that stored lot size as acres.
   */
  lotSizeAcres?: number;

  yearBuilt?: number;
  hoa?: ListingHoa;
  enhancements?: ListingEnhancements;
  schools?: ListingSchools;

  address: ListingAddress;
  location: ListingLocation;

  photos: ListingPhoto[];
  featuredPhotoUrl?: string;
  photoCount: number;

  favoriteCount: number;
  viewCount: number;
  inquiryCount: number;

  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}