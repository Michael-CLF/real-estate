import { Listing } from '../models/listing.model';

export abstract class ListingRepository {
  abstract createDraft(
    listing: Omit<Listing, 'Uid' | 'createdAt' | 'updatedAt'>
  ): Promise<string>;

  abstract updateDraft(
    listingUid: string,
    changes: Partial<Listing>
  ): Promise<void>;

  abstract getByUid(
    listingUid: string
  ): Promise<Listing | null>;
}