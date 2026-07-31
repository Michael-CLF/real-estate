import { Listing } from '../../../core/domains/listings/models/listing.model';

export interface DashboardState {
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

export interface SavedPropertySummary {
  listingUid: string;
  sellerUid: string;
  address: string;
  city: string;
  state: string;
  price: number;
  primaryPhotoUrl?: string;
  daysOnMarket: number;
  createdAt: Date;
}