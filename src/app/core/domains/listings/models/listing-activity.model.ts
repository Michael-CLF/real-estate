export type ListingActivityType =
  | 'listing_published'
  | 'price_change'
  | 'inquiry_received'
  | 'showing_requested'
  | 'showing_confirmed'
  | 'showing_alternate_proposed'
  | 'showing_declined'
  | 'showing_cancelled'
  | 'showing_completed';

export interface ListingActivityItem {
  activityUid: string;
  activityType: ListingActivityType;

  title: string;
  description: string;
  occurredAt: string;

  referenceNumber: string | null;

  inquiryUid: string | null;
  showingRequestUid: string | null;
}

export interface ListingActivitySummary {
  views: number;
  saves: number;

  inquiries: number;
  unreadInquiries: number;

  showingRequests: number;
  pendingShowingRequests: number;
}

export interface GetListingActivityRequest {
  listingUid: string;
}

export interface GetListingActivityResponse {
  listingUid: string;
  activities: ListingActivityItem[];
  summary: ListingActivitySummary;
}