import { ListingPhoto } from './listing-photo.model';
import { ListingStatus } from './listing-status.type';
import { PropertyType } from './property-type.type';

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
  id: string;
  sellerId: string;

  status: ListingStatus;
  propertyType: PropertyType;

  title: string;
  description: string;

  price: number;

  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSizeAcres?: number;
  yearBuilt?: number;

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