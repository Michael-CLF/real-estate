import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from 'firebase/firestore';

import { AuthState } from '../../../core/authentication/state/auth.state';
import { firestore } from '../../../core/infrastructure/firebase/firebase';

import { Listing } from '../../../core/domains/listings/models/listing.model';
import { SavedPropertySummary } from '../models/dashboard-state.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly authState = inject(AuthState);

  get currentUserId(): string {
    const uid = this.authState.uid();

    if (!uid) {
      throw new Error('No authenticated user.');
    }

    return uid;
  }

  async getCurrentUserFirstName(): Promise<string> {

    const userRef = doc(
      firestore,
      'users',
      this.currentUserId
    );

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return '';
    }

    const data = snapshot.data();

    return typeof data['firstName'] === 'string'
      ? data['firstName'].trim()
      : '';
  }

  async getDraftListings(): Promise<Listing[]> {

    const listingsRef = collection(firestore, 'listings');

    const listingsQuery = query(
      listingsRef,
      where('sellerUid', '==', this.currentUserId),
      where('status', '==', 'draft')
    );

    const snapshot = await getDocs(listingsQuery);

    return snapshot.docs.map(doc => doc.data() as Listing);

  }

  async getActiveListings(): Promise<Listing[]> {

    const listingsRef = collection(firestore, 'listings');

    const listingsQuery = query(
      listingsRef,
      where('sellerUid', '==', this.currentUserId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(listingsQuery);

    return snapshot.docs.map(doc => doc.data() as Listing);

  }

  async getSavedHomes(): Promise<SavedPropertySummary[]> {
    // TODO: Load from Firestore once favorites are implemented.
    return [];
  }
}