import { Injectable, inject } from '@angular/core';
import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where
} from 'firebase/firestore';

import { AuthState } from '../../../core/authentication/state/auth.state';
import { firestore } from '../../../core/infrastructure/firebase/firebase';
import {
  Listing,
  ListingDraft,
  ListingFeatures
} from '../../../core/domains/listings/models/listing.model';

import {
  SavedPropertyStatus,
  SavedPropertySummary
} from '../models/dashboard-state.model';

import {
  ListingService
} from '../../../core/domains/listings/services/listing.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly authState = inject(AuthState);
  private readonly listingService =
    inject(ListingService);

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
    const drafts =
      await this.listingService.getSellerDrafts(
        this.currentUserId
      );

    return drafts
      .filter(draft =>
        draft.publication.status !== 'published' &&
        draft.publication.paymentStatus !== 'paid'
      )
      .map(draft =>
        this.mapDraftToDashboardListing(draft)
      );
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

  async getSavedHomes():
    Promise<SavedPropertySummary[]> {

    const savedListingsRef =
      collection(
        firestore,
        'users',
        this.currentUserId,
        'savedListings'
      );

    const savedListingsQuery =
      query(
        savedListingsRef,
        orderBy(
          'createdAt',
          'desc'
        )
      );

    const snapshot =
      await getDocs(
        savedListingsQuery
      );

    return Promise.all(
      snapshot.docs.map(
        async savedListingDocument => {

          const data =
            savedListingDocument.data();

          const listingUid =
            typeof data['listingUid'] === 'string'
              ? data['listingUid']
              : savedListingDocument.id;

          const listingSnapshot =
            await getDoc(
              doc(
                firestore,
                'listings',
                listingUid
              )
            );

          const listingStatus =
            listingSnapshot.exists()
              ? listingSnapshot.data()['status']
              : 'unavailable';

          const {
            status,
            statusLabel
          } = this.mapSavedPropertyStatus(
            listingStatus
          );

          return {
            listingUid,
            sellerUid:
              typeof data['sellerUid'] === 'string'
                ? data['sellerUid']
                : '',

            address:
              typeof data['address'] === 'string'
                ? data['address']
                : '',

            city:
              typeof data['city'] === 'string'
                ? data['city']
                : '',

            state:
              typeof data['state'] === 'string'
                ? data['state']
                : '',

            price:
              typeof data['price'] === 'number'
                ? data['price']
                : 0,

            primaryPhotoUrl:
              typeof data['primaryPhotoUrl'] ===
                'string'
                ? data['primaryPhotoUrl']
                : undefined,

            photo:
              typeof data['photo'] === 'string'
                ? data['photo']
                : undefined,

            daysOnMarket:
              typeof data['daysOnMarket'] ===
                'number'
                ? data['daysOnMarket']
                : 0,

            createdAt:
              data['createdAt']?.toDate?.() ??
              null,

            status,
            statusLabel
          };
        }
      )
    );
  }

  private mapSavedPropertyStatus(
    listingStatus: unknown
  ): {
    status: SavedPropertyStatus;
    statusLabel: string;
  } {
    if (typeof listingStatus !== 'string') {
      return {
        status: 'unavailable',
        statusLabel: 'No Longer Available'
      };
    }

    const normalizedStatus =
      listingStatus
        .trim()
        .toLowerCase()
        .replace(/_/g, '-')
        .replace(/\s+/g, '-');

    switch (normalizedStatus) {
      case 'active':
      case 'published':
        return {
          status: 'active',
          statusLabel: 'Active'
        };

      case 'pending':
      case 'under-contract':
        return {
          status: 'under-contract',
          statusLabel: 'Under Contract'
        };

      case 'sold':
      case 'closed':
        return {
          status: 'sold',
          statusLabel: 'Sold'
        };

      case 'withdrawn':
      case 'cancelled':
      case 'canceled':
        return {
          status: 'withdrawn',
          statusLabel: 'Withdrawn'
        };

      default:
        return {
          status: 'unavailable',
          statusLabel: 'No Longer Available'
        };
    }
  }

  async removeSavedHome(
    listingUid: string
  ): Promise<void> {
    const normalizedListingUid =
      listingUid.trim();

    if (!normalizedListingUid) {
      throw new Error(
        'A listing UID is required.'
      );
    }

    const savedListingRef = doc(
      firestore,
      'users',
      this.currentUserId,
      'savedListings',
      normalizedListingUid
    );

    await deleteDoc(savedListingRef);
  }

  private mapDraftToDashboardListing(
    draft: ListingDraft
  ): Listing {
    const primaryPhoto =
      draft.photos?.find(
        photo => photo.isPrimary
      ) ??
      draft.photos?.[0];

    return {
      Uid: draft.Uid,
      sellerUid: draft.sellerUid,

      addressLine1:
        draft.address?.addressLine1 ?? '',

      addressLine2:
        draft.address?.addressLine2,

      city:
        draft.address?.city ?? '',

      state:
        draft.address?.state ?? '',

      zipCode:
        draft.address?.zipCode ?? '',

      county:
        draft.address?.county ?? '',

      listPrice:
        draft.pricing?.listPrice ?? 0,

      propertyType:
        draft.propertyDetails?.propertyType ??
        'single_family',

      bedrooms:
        draft.propertyDetails?.bedrooms ?? 0,

      bathrooms:
        draft.propertyDetails?.bathrooms ?? 0,

      squareFeet:
        draft.propertyDetails?.squareFeet ?? 0,

      lotSize:
        draft.propertyDetails?.lotSize,

      yearBuilt:
        draft.propertyDetails?.yearBuilt,

      description:
        draft.propertyDetails?.description,

      features:
        draft.features ??
        this.createEmptyFeatures(),

      primaryPhotoUrl:
        draft.primaryPhotoUrl ??
        primaryPhoto?.fullImageUrl,

      photoUrls:
        draft.photoUrls ??
        draft.photos?.map(
          photo => photo.fullImageUrl
        ) ??
        [],

      photos:
        draft.photos ?? [],

      featuredListing:
        draft.featuredListing,

      promotion:
        draft.promotion,

      certification:
        draft.certification,

      workflow: {
        identityVerified:
          draft.publication.identityStatus ===
          'verified',

        paymentCompleted:
          draft.publication.paymentStatus ===
          'paid',

        published:
          draft.publication.status ===
          'published'
      },

      status: 'draft',

      draftStep:
        draft.progress.currentStep,

      completionPercent:
        draft.progress.completionPercent,

      daysOnMarket: 0,
      views: 0,
      favorites: 0,

      createdAt:
        draft.createdAt,

      updatedAt:
        draft.updatedAt
    };
  }


  private createEmptyFeatures():
    ListingFeatures {

    return {
      kitchenIsland: false,
      pantry: false,
      stoneCountertops: false,
      stainlessAppliances: false,
      gasRange: false,
      doubleOven: false,

      fireplace: false,
      hardwoodFloors: false,
      vaultedCeilings: false,
      homeOffice: false,
      bonusRoom: false,
      basement: false,

      walkInCloset: false,
      ensuiteBath: false,
      doubleVanity: false,
      soakingTub: false,
      separateShower: false,

      deck: false,
      patio: false,
      porch: false,
      fencedYard: false,
      pool: false,
      outdoorKitchen: false,

      attachedGarage: false,
      detachedGarage: false,
      carport: false,
      evCharging: false,

      centralHvac: false,
      heatPump: false,
      gasHeat: false,
      centralAir: false,
      solarPanels: false,
      generator: false,
      smartThermostat: false
    };
  }
}