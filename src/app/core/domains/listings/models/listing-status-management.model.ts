export type SellerControlledListingStatus =
  | 'active'
  | 'paused'
  | 'under_contract'
  | 'sold'
  | 'withdrawn';

export type StoredSellerListingStatus =
  | 'published'
  | SellerControlledListingStatus;

export type ListingStatusChangeType =
  | 'paused'
  | 'reactivated'
  | 'under_contract'
  | 'sold'
  | 'withdrawn';

export interface UpdateListingStatusRequest {
  listingUid: string;
  newStatus: SellerControlledListingStatus;
  reason?: string;
}

export interface UpdateListingStatusResponse {
  listingUid: string;
  previousStatus: StoredSellerListingStatus;
  newStatus: SellerControlledListingStatus;
  statusChangeType: ListingStatusChangeType;
  statusHistoryUid: string;
}