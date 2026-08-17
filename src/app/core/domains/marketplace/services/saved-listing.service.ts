import {
  Injectable
} from '@angular/core';

import {
  httpsCallable
} from 'firebase/functions';

import {
  doc,
  getDoc
} from 'firebase/firestore';

import {
  firestore,
  functions
} from '../../../infrastructure/firebase/firebase';

import {
  MarketplaceListing
} from '../models/marketplace-listing.model';

interface SaveMarketplaceListingRequest {
  listingUid: string;
}

interface SaveMarketplaceListingResponse {
  listingUid: string;
  isSaved: true;
  favoriteCount: number;
}

interface RemoveSavedMarketplaceListingRequest {
  listingUid: string;
}

interface RemoveSavedMarketplaceListingResponse {
  listingUid: string;
  isSaved: false;
  favoriteCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class SavedListingService {
  private readonly saveMarketplaceListingFunction =
    httpsCallable<
      SaveMarketplaceListingRequest,
      SaveMarketplaceListingResponse
    >(
      functions,
      'saveMarketplaceListing'
    );

  private readonly removeSavedMarketplaceListingFunction =
    httpsCallable<
      RemoveSavedMarketplaceListingRequest,
      RemoveSavedMarketplaceListingResponse
    >(
      functions,
      'removeSavedMarketplaceListing'
    );

  async isListingSaved(
    userUid: string,
    listingUid: string
  ): Promise<boolean> {
    const savedListingRef =
      doc(
        firestore,
        'users',
        userUid,
        'savedListings',
        listingUid
      );

    const snapshot =
      await getDoc(
        savedListingRef
      );

    return snapshot.exists();
  }

  async saveListing(
    userUid: string,
    listing: MarketplaceListing
  ): Promise<void> {
    this.validateUserUid(
      userUid
    );

    const result =
      await this
        .saveMarketplaceListingFunction({
          listingUid:
            listing.uid
        });

    if (
      !result.data.isSaved ||
      result.data.listingUid !==
      listing.uid
    ) {
      throw new Error(
        'The listing could not be confirmed as saved.'
      );
    }
  }

  async removeSavedListing(
    userUid: string,
    listingUid: string
  ): Promise<void> {
    this.validateUserUid(
      userUid
    );

    const result =
      await this
        .removeSavedMarketplaceListingFunction({
          listingUid
        });

    if (
      result.data.isSaved ||
      result.data.listingUid !==
      listingUid
    ) {
      throw new Error(
        'The listing could not be confirmed as removed.'
      );
    }
  }

  private validateUserUid(
    userUid: string
  ): void {
    if (!userUid.trim()) {
      throw new Error(
        'An authenticated user is required.'
      );
    }
  }
}