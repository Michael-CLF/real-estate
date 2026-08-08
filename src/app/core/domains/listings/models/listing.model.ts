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
  id: string;
  originalFileName: string;

  storagePath: string;
  thumbnailStoragePath: string;

  fullImageUrl: string;
  thumbnailUrl: string;

  isPrimary: boolean;
  sortOrder: number;

  width: number;
  height: number;
  sizeBytes: number;

  thumbnailWidth: number;
  thumbnailHeight: number;
  thumbnailSizeBytes: number;
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

  /*
 * A listing draft remains in the listingDrafts collection
 * until identity verification, payment, and publication
 * requirements have been completed.
 */
export interface ListingDraft {
  Uid: string;
  sellerUid: string;

  address?: ListingDraftAddress;
  propertyDetails?: ListingDraftPropertyDetails;
  features?: ListingFeatures;
  photos?: ListingPhotoReference[];
  pricing?: ListingDraftPricing;

  primaryPhotoUrl?: string;
  photoUrls?: string[];

  featuredListing: boolean;
  promotion?: ListingPromotion;

  certification: ListingCertification;

  progress: ListingDraftProgress;
  publication: ListingPublicationWorkflow;

  createdAt: Date;
  updatedAt: Date;
  lastSavedAt: Date;
}

export interface ListingDraftAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  county: string;
}

export interface ListingDraftPropertyDetails {
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  lotSize?: number;
  yearBuilt: number;
  description?: string;
}

export interface ListingDraftPricing {
  listPrice: number;
}

export interface ListingDraftProgress {
  /*
   * The step the seller should see when reopening
   * the listing wizard.
   */
  currentStep: ListingDraftStep;

  /*
   * The most recent step that was successfully
   * validated and saved.
   */
  lastCompletedStep?: ListingDraftStep;

  completedSteps: ListingDraftStep[];

  completionPercent: number;

  contentStatus:
    | 'in_progress'
    | 'complete';
}

export interface ListingPublicationWorkflow {
  status: ListingPublicationStatus;

  identityStatus: ListingIdentityStatus;
  paymentStatus: ListingPaymentStatus;

  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;

  paymentAmount?: number;
  paidAt?: Date;

  publishedListingUid?: string;
  publishedAt?: Date;
}

export type ListingPublicationStatus =
  | 'content_incomplete'
  | 'identity_required'
  | 'identity_pending'
  | 'payment_required'
  | 'payment_processing'
  | 'payment_failed'
  | 'ready_to_publish'
  | 'published';

export type ListingIdentityStatus =
  | 'not_started'
  | 'pending'
  | 'processing'
  | 'verified'
  | 'failed'
  | 'requires_input';

export type ListingPaymentStatus =
  | 'not_started'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded';