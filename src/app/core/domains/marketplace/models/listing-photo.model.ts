export interface ListingPhoto {
  id: string;
  listingId: string;

  url: string;
  storagePath: string;

  altText: string;
  caption?: string;

  sortOrder: number;
  isFeatured: boolean;

  width?: number;
  height?: number;

  createdAt: Date;
}