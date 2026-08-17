export type ListingInquiryStatus =
  | 'new'
  | 'read';

export interface ListingInquiry {
  inquiryUid: string;
  inquiryReferenceNumber: string;

  listingUid: string;
  sellerUid: string;
  buyerUid: string;

  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;

  message: string;
  status: ListingInquiryStatus;
  isRead: boolean;

  propertyAddress: string;
  primaryPhotoUrl: string | null;

  createdAt: string;
  updatedAt: string;
  readAt: string | null;
}

export interface CreateListingInquiryRequest {
  listingUid: string;
  message: string;
}

export interface CreateListingInquiryResponse {
  inquiryUid: string;
  inquiryReferenceNumber: string;
}

export interface GetListingInquiriesRequest {
  listingUid: string;
}

export interface GetListingInquiriesResponse {
  inquiries: ListingInquiry[];
  unreadCount: number;
}

export interface MarkListingInquiryReadRequest {
  inquiryUid: string;
}

export interface MarkListingInquiryReadResponse {
  inquiryUid: string;
  status: ListingInquiryStatus;
  isRead: boolean;
  readAt: string;
}

export type ListingInquiryActivityPerspective =
  | 'sent'
  | 'received';

export interface ListingInquiryActivity {
  inquiryUid: string;
  inquiryReferenceNumber: string;
  listingUid: string;

  perspective:
    ListingInquiryActivityPerspective;

  status:
    ListingInquiryStatus;

  buyerName: string;
  propertyAddress: string;

  createdAt: string;
  readAt: string | null;
}

export interface GetUserInquiryActivityResponse {
  activities: ListingInquiryActivity[];
}