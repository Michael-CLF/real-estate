export interface Listing {
  Uid: string;
  companyUid: string;
  sellerUid: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
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
  draftStep?: ListingDraftStep;
  completionPercent?: number;
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
  | 'mobile'
  | 'pud';

export type ListingDraftStep =
  | 'address'
  | 'property_details'
  | 'property_features'
  | 'photos'
  | 'pricing'
  | 'review';