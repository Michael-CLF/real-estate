import {
  Injectable
} from '@angular/core';

import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

import {
  firestore
} from '../../../infrastructure/firebase/firebase';

import {
  MarketplaceListing
} from '../models/marketplace-listing.model';

@Injectable({
  providedIn: 'root'
})
export class SavedListingService {

  async isListingSaved(
    userUid: string,
    listingUid: string
  ): Promise<boolean> {

    const savedListingRef = doc(
      firestore,
      'users',
      userUid,
      'savedListings',
      listingUid
    );

    const snapshot =
      await getDoc(savedListingRef);

    return snapshot.exists();
  }

  async saveListing(
    userUid: string,
    listing: MarketplaceListing
  ): Promise<void> {

    const savedListingRef = doc(
      firestore,
      'users',
      userUid,
      'savedListings',
      listing.uid
    );

    await setDoc(
      savedListingRef,
      {
        listingUid:
          listing.uid,

        sellerUid:
          listing.sellerUid,

        address:
          listing.address.addressLine1,

        city:
          listing.address.city,

        state:
          listing.address.stateAbbreviation,

        price:
          listing.price,

        primaryPhotoUrl:
          listing.featuredPhotoUrl ?? null,

        daysOnMarket:
          this.calculateDaysOnMarket(
            listing.publishedAt
          ),

        createdAt:
          serverTimestamp()
      }
    );
  }

  async removeSavedListing(
    userUid: string,
    listingUid: string
  ): Promise<void> {

    const savedListingRef = doc(
      firestore,
      'users',
      userUid,
      'savedListings',
      listingUid
    );

    await deleteDoc(savedListingRef);
  }

  private calculateDaysOnMarket(
    publishedAt?: Date
  ): number {

    if (!publishedAt) {
      return 0;
    }

    const millisecondsPerDay =
      1000 * 60 * 60 * 24;

    const elapsedMilliseconds =
      Date.now() - publishedAt.getTime();

    return Math.max(
      0,
      Math.floor(
        elapsedMilliseconds /
        millisecondsPerDay
      )
    );
  }
}