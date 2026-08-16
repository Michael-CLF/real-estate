import {
  Listing
} from '../../../core/domains/listings/models/listing.model';

export type SavedPropertyStatus =
  | 'active'
  | 'under-contract'
  | 'sold'
  | 'withdrawn'
  | 'unavailable';

export interface SavedPropertySummary {
  listingUid: string;
  sellerUid: string;

  address: string;
  city: string;
  state: string;

  price: number;
  primaryPhotoUrl?: string;
  photo?: string;

  daysOnMarket: number;
  createdAt: Date | null;

  status: SavedPropertyStatus;
  statusLabel: string;
}

export interface DashboardState {
  firstName: string;
  userProfile: DashboardUserProfile | null;
  hasListings: boolean;
  hasDraftListings: boolean;
  hasSavedProperties: boolean;
  hasMessages: boolean;
  hasOffers: boolean;
  hasShowings: boolean;

  showWelcome: boolean;

  draftListings: Listing[];
  activeListings: Listing[];
  savedProperties: SavedPropertySummary[];
}

export interface DashboardUserProfile {
  accountNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  emailVerified: boolean;
}