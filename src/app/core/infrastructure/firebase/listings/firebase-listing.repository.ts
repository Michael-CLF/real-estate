import { Injectable } from '@angular/core';

import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

import { firestore } from '../firebase';

import {
  Listing
} from '../../../domains/listings/models/listing.model';

import {
  ListingRepository
} from '../../../domains/listings/repositories/listing.repository';

@Injectable({
  providedIn: 'root'
})
export class FirebaseListingRepository extends ListingRepository {

  async createDraft(
    listing: Omit<Listing, 'Uid' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {

    const listingsCollection = collection(
      firestore,
      'listings'
    );

    const sanitizedListing =
      this.removeUndefinedValues(listing);

    const documentReference = await addDoc(
      listingsCollection,
      {
        ...sanitizedListing,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );

    return documentReference.id;
  }

  async updateDraft(
    listingUid: string,
    changes: Partial<Listing>
  ): Promise<void> {

    const listingReference = doc(
      firestore,
      'listings',
      listingUid
    );

    const sanitizedChanges =
      this.removeUndefinedValues(changes);

    await updateDoc(
      listingReference,
      {
        ...sanitizedChanges,
        updatedAt: serverTimestamp()
      }
    );
  }

  async getByUid(
    listingUid: string
  ): Promise<Listing | null> {

    const listingReference = doc(
      firestore,
      'listings',
      listingUid
    );

    const snapshot = await getDoc(
      listingReference
    );

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    return {
      ...data,

      Uid: snapshot.id,

      createdAt:
        data['createdAt']?.toDate?.() ??
        new Date(),

      updatedAt:
        data['updatedAt']?.toDate?.() ??
        new Date(),

      publishedAt:
        data['publishedAt']?.toDate?.()

    } as Listing;
  }

  private removeUndefinedValues<T>(value: T): T {
    if (Array.isArray(value)) {
      return value.map(item =>
        this.removeUndefinedValues(item)
      ) as T;
    }

    if (
      value !== null &&
      typeof value === 'object' &&
      !(value instanceof Date)
    ) {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, item]) => item !== undefined)
          .map(([key, item]) => [
            key,
            this.removeUndefinedValues(item)
          ])
      ) as T;
    }

    return value;
  }
}