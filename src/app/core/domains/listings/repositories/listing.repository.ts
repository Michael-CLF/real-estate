import {
  Listing,
  ListingDraft
} from '../models/listing.model';

export type InitialListingDraft = Omit<
  ListingDraft,
  'Uid' | 'createdAt' | 'updatedAt' | 'lastSavedAt'
>;

export type ListingDraftChanges = Partial<
  Omit<
    ListingDraft,
    'Uid' | 'sellerUid' | 'createdAt' | 'updatedAt' | 'lastSavedAt'
  >
>;

export type InitialPublishedListing = Omit<
  Listing,
  'Uid' | 'createdAt' | 'updatedAt'
>;

export abstract class ListingRepository {
  /*
   * DRAFT OPERATIONS
   *
   * These methods operate on:
   * listingDrafts/{listingUid}
   */

  abstract createInitialDraft(
    draft: InitialListingDraft
  ): Promise<string>;

  abstract updateDraft(
    listingUid: string,
    changes: ListingDraftChanges
  ): Promise<void>;

  abstract getDraftByUid(
    listingUid: string
  ): Promise<ListingDraft | null>;

  abstract getDraftsBySellerUid(
    sellerUid: string
  ): Promise<ListingDraft[]>;

  /*
   * PUBLISHED LISTING OPERATIONS
   *
   * These methods operate on:
   * listings/{listingUid}
   */

  abstract createPublishedListing(
    listing: InitialPublishedListing
  ): Promise<string>;

  abstract getPublishedListingByUid(
    listingUid: string
  ): Promise<Listing | null>;
}