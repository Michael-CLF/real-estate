export type ListingBadgeType =
  | 'featured'
  | 'new-listing'
  | 'coming-soon'
  | 'hot-property'
  | 'price-reduced'
  | 'offer-pending'
  | 'under-contract'
  | 'sold';

export type ListingBadgeTone =
  | 'gold'
  | 'teal'
  | 'navy'
  | 'coral'
  | 'green';

export interface ListingBadge {
  type: ListingBadgeType;
  label: string;
  icon: string;
  tone: ListingBadgeTone;
  priority: number;
}

export interface ListingBadgeSource {
  status: string;
  pendingOfferCount?: number;
  featuredListing?: boolean;

  price: number;
  originalPrice?: number;

  viewCount?: number;
  favoriteCount?: number;
  inquiryCount?: number;

  publishedAt?: Date;
}
