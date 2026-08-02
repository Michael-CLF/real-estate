export interface Listing {
  Uid: string;
  sellerUid: string;

  // Address
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;

  // Property
  listPrice: number;
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize?: number;
  yearBuilt?: number;
  description?: string;

  // Features
  features: ListingFeatures;

  // Photos
  primaryPhotoUrl?: string;
  photoUrls?: string[];
  photos?: ListingPhotoReference[];

  // Listing upgrades
  featuredListing: boolean;

  // Promotion
  promotion?: ListingPromotion;

  // Seller certification
  certification: ListingCertification;

  // Workflow
  workflow: ListingWorkflow;

  // Marketplace
  status: ListingStatus;
  draftStep?: ListingDraftStep;
  completionPercent?: number;
  daysOnMarket: number;
  views: number;
  favorites: number;

  // Dates
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingFeatures {
  kitchenIsland: boolean;
  pantry: boolean;
  stoneCountertops: boolean;
  stainlessAppliances: boolean;
  gasRange: boolean;
  doubleOven: boolean;

  fireplace: boolean;
  hardwoodFloors: boolean;
  vaultedCeilings: boolean;
  homeOffice: boolean;
  bonusRoom: boolean;
  basement: boolean;

  walkInCloset: boolean;
  ensuiteBath: boolean;
  doubleVanity: boolean;
  soakingTub: boolean;
  separateShower: boolean;

  deck: boolean;
  patio: boolean;
  porch: boolean;
  fencedYard: boolean;
  pool: boolean;
  outdoorKitchen: boolean;

  attachedGarage: boolean;
  detachedGarage: boolean;
  carport: boolean;
  evCharging: boolean;

  centralHvac: boolean;
  heatPump: boolean;
  gasHeat: boolean;
  centralAir: boolean;
  solarPanels: boolean;
  generator: boolean;
  smartThermostat: boolean;
}

export interface ListingPhotoReference {
  storagePath: string;
  thumbnailStoragePath: string;
  isPrimary: boolean;
  sortOrder: number;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ListingPromotion {
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  discountAmount: number;
}

export interface ListingCertification {
  accepted: boolean;
  acceptedAt?: Date;
}

export interface ListingWorkflow {
  identityVerified: boolean;
  paymentCompleted: boolean;
  published: boolean;
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