import {
  Listing,
  ListingDraft
} from '../models/listing.model';


export type InitialListingDraft =
  Omit<
    ListingDraft,
    'Uid' | 'createdAt' | 'updatedAt' | 'lastSavedAt'
  >;


export abstract class ListingRepository {

  /*
   * DRAFT OPERATIONS
   *
   * All of these methods operate on:
   *
   * listingDrafts/{listingUid}
   */

  abstract createInitialDraft(
    draft: InitialListingDraft
  ): Promise<string>;

  abstract updateDraft(
    listingUid: string,
    changes: Partial<ListingDraft>
  ): Promise<void>;

  abstract getDraftByUid(
    listingUid: string
  ): Promise<ListingDraft | null>;

  abstract getDraftsBySellerUid(
    sellerUid: string
  ): Promise<ListingDraft[]>;

  abstract createPublishedListing(
    listing: Omit<
      Listing,
      'Uid' | 'createdAt' | 'updatedAt'
    >
  ): Promise<string>;

  abstract getPublishedListingByUid(
    listingUid: string
  ): Promise<Listing | null>;
}