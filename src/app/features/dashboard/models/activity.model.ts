export interface Activity {
  id: string;

  companyUid: string;
  listingUid: string;

  sellerUid: string;

  type: ActivityType;

  title: string;
  description: string;

  relatedId?: string;

  isRead: boolean;

  createdAt: Date;
}

export type ActivityType =
  | 'listing_created'
  | 'listing_published'
  | 'listing_updated'
  | 'price_changed'
  | 'photo_added'
  | 'document_uploaded'
  | 'showing_requested'
  | 'showing_confirmed'
  | 'showing_completed'
  | 'offer_received'
  | 'offer_updated'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'offer_countered'
  | 'transaction_started'
  | 'transaction_completed';