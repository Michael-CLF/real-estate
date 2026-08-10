import { Injectable } from '@angular/core';

import {
  DocumentData,
  DocumentSnapshot,
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';

import { firestore } from '../firebase';

import {
  Listing,
  ListingDraft
} from '../../../domains/listings/models/listing.model';

import {
  InitialListingDraft,
  InitialPublishedListing,
  ListingDraftChanges,
  ListingRepository
} from '../../../domains/listings/repositories/listing.repository';

@Injectable({
  providedIn: 'root'
})
export class FirebaseListingRepository extends ListingRepository {
  private readonly draftCollectionName = 'listingDrafts';
  private readonly publishedCollectionName = 'listings';

  /*
   * DRAFT OPERATIONS
   */

  async createInitialDraft(
    draft: InitialListingDraft
  ): Promise<string> {
    const draftsCollection = collection(
      firestore,
      this.draftCollectionName
    );

    const sanitizedDraft =
      this.removeUndefinedValues(draft);

    const documentReference = await addDoc(
      draftsCollection,
      {
        ...sanitizedDraft,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSavedAt: serverTimestamp()
      }
    );

    return documentReference.id;
  }

  async updateDraft(
    listingUid: string,
    changes: ListingDraftChanges
  ): Promise<void> {
    const draftReference = doc(
      firestore,
      this.draftCollectionName,
      listingUid
    );

    const sanitizedChanges =
      this.removeUndefinedValues(changes);

    await updateDoc(
      draftReference,
      {
        ...sanitizedChanges,
        updatedAt: serverTimestamp(),
        lastSavedAt: serverTimestamp()
      }
    );
  }

  async getDraftByUid(
    listingUid: string
  ): Promise<ListingDraft | null> {
    const draftReference = doc(
      firestore,
      this.draftCollectionName,
      listingUid
    );

    const snapshot = await getDoc(draftReference);

    if (!snapshot.exists()) {
      return null;
    }

    return this.mapDraftSnapshot(snapshot);
  }

  async getDraftsBySellerUid(
    sellerUid: string
  ): Promise<ListingDraft[]> {
    const draftsQuery = query(
      collection(
        firestore,
        this.draftCollectionName
      ),
      where(
        'sellerUid',
        '==',
        sellerUid
      )
    );

    const snapshot = await getDocs(draftsQuery);

    return snapshot.docs
      .map((draftSnapshot) =>
        this.mapDraftSnapshot(draftSnapshot)
      )
      .sort(
        (firstDraft, secondDraft) =>
          secondDraft.updatedAt.getTime() -
          firstDraft.updatedAt.getTime()
      );
  }

  /*
   * PUBLISHED LISTING OPERATIONS
   */

  async createPublishedListing(
    listing: InitialPublishedListing
  ): Promise<string> {
    const publishedCollection = collection(
      firestore,
      this.publishedCollectionName
    );

    const sanitizedListing =
      this.removeUndefinedValues(listing);

    const documentReference = await addDoc(
      publishedCollection,
      {
        ...sanitizedListing,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );

    return documentReference.id;
  }

  async getPublishedListingByUid(
    listingUid: string
  ): Promise<Listing | null> {
    const listingReference = doc(
      firestore,
      this.publishedCollectionName,
      listingUid
    );

    const snapshot = await getDoc(listingReference);

    if (!snapshot.exists()) {
      return null;
    }

    return this.mapPublishedListingSnapshot(snapshot);
  }

  /*
   * FIRESTORE MAPPING
   */

  private mapDraftSnapshot(
    snapshot: DocumentSnapshot<DocumentData>
  ): ListingDraft {
    const data = snapshot.data();

    if (!data) {
      throw new Error(
        `Listing draft ${snapshot.id} contains no data.`
      );
    }

    return {
      ...data,
      Uid: snapshot.id,

      certification: {
        ...data['certification'],
        acceptedAt: this.toOptionalDate(
          data['certification']?.acceptedAt
        )
      },

      publication: {
        ...data['publication'],
        paidAt: this.toOptionalDate(
          data['publication']?.paidAt
        ),
        publishedAt: this.toOptionalDate(
          data['publication']?.publishedAt
        )
      },

      createdAt: this.toDate(data['createdAt']),
      updatedAt: this.toDate(data['updatedAt']),
      lastSavedAt: this.toDate(data['lastSavedAt'])
    } as ListingDraft;
  }

  private mapPublishedListingSnapshot(
    snapshot: DocumentSnapshot<DocumentData>
  ): Listing {
    const data = snapshot.data();

    if (!data) {
      throw new Error(
        `Published listing ${snapshot.id} contains no data.`
      );
    }

    return {
      ...data,
      Uid: snapshot.id,

      certification: {
        ...data['certification'],
        acceptedAt: this.toOptionalDate(
          data['certification']?.acceptedAt
        )
      },

      publishedAt: this.toOptionalDate(
        data['publishedAt']
      ),

      createdAt: this.toDate(data['createdAt']),
      updatedAt: this.toDate(data['updatedAt'])
    } as Listing;
  }

  private toDate(
    value: unknown
  ): Date {
    if (value instanceof Date) {
      return value;
    }

    if (value instanceof Timestamp) {
      return value.toDate();
    }

    if (
      value !== null &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof value.toDate === 'function'
    ) {
      return value.toDate();
    }

    return new Date();
  }

  private toOptionalDate(
    value: unknown
  ): Date | undefined {
    if (
      value === undefined ||
      value === null
    ) {
      return undefined;
    }

    return this.toDate(value);
  }

  private removeUndefinedValues<T>(
    value: T
  ): T {
    if (Array.isArray(value)) {
      return value.map((item) =>
        this.removeUndefinedValues(item)
      ) as T;
    }

    if (
      value !== null &&
      typeof value === 'object' &&
      !(value instanceof Date) &&
      !(value instanceof Timestamp)
    ) {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, item]) =>
            item !== undefined
          )
          .map(([key, item]) => [
            key,
            this.removeUndefinedValues(item)
          ])
      ) as T;
    }

    return value;
  }
}