export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'active'
  | 'paused'
  | 'under_contract'
  | 'sold'
  | 'withdrawn'
  | 'archived';

export const LISTING_STATUSES:
  readonly ListingStatus[] = [
    'draft',
    'pending_review',
    'published',
    'active',
    'paused',
    'under_contract',
    'sold',
    'withdrawn',
    'archived'
  ] as const;