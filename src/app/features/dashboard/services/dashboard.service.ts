import { Injectable, inject } from '@angular/core';
import {
  httpsCallable
} from 'firebase/functions';

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
import { firestore, functions } from '../../../core/infrastructure/firebase/firebase';
import {
  Listing,
  ListingDraft,
  ListingFeatures
} from '../../../core/domains/listings/models/listing.model';

import {
  DashboardUserProfile,
  SavedPropertyStatus,
  SavedPropertySummary
} from '../models/dashboard-state.model';

import {
  ListingService
} from '../../../core/domains/listings/services/listing.service';

interface EnsureUserAccountNumberResponse {
  accountNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private readonly authState = inject(AuthState);
  private readonly listingService =
    inject(ListingService);

  private readonly ensureUserAccountNumberFunction =
    httpsCallable<
      Record<string, never>,
      EnsureUserAccountNumberResponse
    >(
      functions,
      'ensureUserAccountNumber'
    );

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

  async getCurrentUserProfile():
  Promise<DashboardUserProfile | null> {

  const accountNumberResult =
    await this.ensureUserAccountNumberFunction({});

  const assignedAccountNumber =
    accountNumberResult.data.accountNumber;

  const userRef = doc(
    firestore,
    'users',
    this.currentUserId
  );

  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  const firstName =
    typeof data['firstName'] === 'string'
      ? data['firstName'].trim()
      : '';

  const lastName =
    typeof data['lastName'] === 'string'
      ? data['lastName'].trim()
      : '';

  const displayName =
    typeof data['displayName'] === 'string'
      ? data['displayName'].trim()
      : '';

  const fullName =
    [firstName, lastName]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    displayName;

  const email =
    typeof data['email'] === 'string'
      ? data['email'].trim()
      : '';

  const phone =
    typeof data['phone'] === 'string'
      ? this.formatPhoneNumber(
          data['phone']
        )
      : '';

  const storedAccountNumber =
    typeof data['accountNumber'] === 'string'
      ? data['accountNumber'].trim()
      : '';

  return {
    accountNumber:
      storedAccountNumber ||
      assignedAccountNumber,

    firstName,
    lastName,
    fullName,
    email,
    phone,

    emailVerified:
      data['emailVerified'] === true
  };
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

      fullBathrooms:
        draft.propertyDetails?.fullBathrooms ?? 0,

      halfBathrooms:
        draft.propertyDetails?.halfBathrooms ?? 0,

      squareFeet:
        draft.propertyDetails?.squareFeet ?? 0,

      lotSize:
        draft.propertyDetails?.lotSize,

      lotSizeUnit:
        draft.propertyDetails?.lotSizeUnit,

      yearBuilt:
        draft.propertyDetails?.yearBuilt,

      stories:
        draft.propertyDetails?.stories,

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
      // Kitchen
      kitchenIsland: false,
      pantry: false,
      stoneCountertops: false,
      softCloseCabinetry: false,
      stainlessAppliances: false,
      gasRange: false,
      doubleOven: false,
      butlersPantry: false,

      // Interior
      fireplace: false,
      hardwoodFloors: false,
      vaultedCeilings: false,
      homeOffice: false,
      bonusRoom: false,
      finishedBasement: false,
      mudroom: false,
      homeGym: false,
      walkInCloset: false,
      customClosets: false,
      builtInShelving: false,
      crownMolding: false,
      wetBar: false,
      mediaRoom: false,
      soundproofing: false,

      // Primary bathroom
      ensuiteBath: false,
      doubleVanity: false,
      soakingTub: false,
      separateTubAndShower: false,
      largeWalkInShower: false,

      // Exterior and outdoor living
      deck: false,
      patio: false,
      porch: false,
      balcony: false,
      fencedYard: false,
      irrigationSystem: false,
      matureLandscaping: false,
      landscapeLighting: false,

      pool: false,
      spaHotTub: false,
      coveredOutdoorLiving: false,
      outdoorCeilingFans: false,
      outdoorHeaters: false,
      outdoorKitchen: false,
      builtInGrill: false,
      firePit: false,
      outdoorFireplace: false,

      shed: false,
      barn: false,
      workshop: false,
      guestHouse: false,
      aduReady: false,
      greenhouse: false,
      gardenArea: false,

      // Parking
      attachedGarage: false,
      detachedGarage: false,
      carport: false,
      garageWorkshop: false,
      rvParking: false,
      boatParking: false,
      evChargingStatus: 'none',

      // Technology and systems
      centralHvac: false,
      heatPump: false,
      gasHeat: false,
      centralAir: false,
      multiZoneHvac: false,

      solarPanels: false,
      generator: false,
      smartThermostat: false,
      smartLighting: false,
      smartLocks: false,
      securitySystem: false,
      securityCameras: false,
      videoDoorbell: false,
      hardwiredEthernet: false,
      builtInSpeakers: false,

      wholeHomeAirFiltration: false,
      waterFiltrationSystem: false,
      waterSenseFixtures: false
    };
  }
  private formatPhoneNumber(
    value: string
  ): string {
    const digits =
      value.replace(/\D/g, '').slice(0, 10);

    if (digits.length !== 10) {
      return value.trim();
    }

    return (
      `(${digits.slice(0, 3)}) ` +
      `${digits.slice(3, 6)}-` +
      digits.slice(6)
    );
  }
}