export interface Listing {
  id: string;

  companyId: string;
  sellerId: string;

  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  zipCode: string;

  listPrice: number;

  propertyType: PropertyType;

  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize?: number;

  yearBuilt?: number;

  primaryPhotoUrl?: string;
  photoUrls?: string[];

  description?: string;

  status: ListingStatus;

  daysOnMarket: number;
  views: number;
  favorites: number;

  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ListingStatus =
  | 'draft'
  | 'coming_soon'
  | 'active'
  | 'under_contract'
  | 'pending'
  | 'sold'
  | 'expired'
  | 'withdrawn';

export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhome'
  | 'multi_family'
  | 'land'
  | 'commercial';