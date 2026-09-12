import {
  Injectable
} from '@angular/core';

import {
  FunctionsError,
  httpsCallable
} from 'firebase/functions';

import {
  functions
} from '../../../core/infrastructure/firebase/firebase';

export type AdministrationListingRecordType =
  | 'draft'
  | 'published';

export type AdministrationListingStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'coming_soon'
  | 'active'
  | 'paused'
  | 'under_contract'
  | 'pending'
  | 'sold'
  | 'expired'
  | 'withdrawn'
  | 'archived';

export interface AdministrationListingAddress {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface AdministrationListing {
  uid: string;
  sellerUid: string;

  recordType:
    AdministrationListingRecordType;

  sourceDraftUid: string | null;

  linkedPublishedListingUid:
    string | null;

  title: string;
  propertyType: string;

  status:
    AdministrationListingStatus;

  publicationStatus: string | null;
  identityStatus: string | null;
  paymentStatus: string | null;

  completionPercent: number | null;

  price: number;
  featuredListing: boolean;

  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;

  address:
    AdministrationListingAddress;

  viewCount: number;
  favoriteCount: number;
  inquiryCount: number;
  photoCount: number;

  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdministrationListingSummary {
  totalListings: number;
  draftListings: number;
  activeListings: number;
  featuredListings: number;
  underContractListings: number;
  soldListings: number;
  inactiveListings: number;
}

export interface GetAdministrationListingsResult {
  listings: AdministrationListing[];
  summary: AdministrationListingSummary;
}

export interface AdministrationListingRelatedSummary {
  offerCount: number;
  inquiryCount: number;
  showingRequestCount: number;
  viewSessionCount: number;
  disclosureCount: number;

  savedCount: number;
  viewCount: number;

  hasMarketingLink: boolean;
  marketingShareCode: string | null;
  marketingShortPath: string | null;

  hasTransaction: boolean;
}


export interface GetAdministrationListingDetailsResult {
  requestedListingUid: string;

  recordType:
    AdministrationListingRecordType;

  sellerUid: string;

  publishedListingUid:
    string | null;

  sourceDraftUid:
    string | null;

  publishedListing:
    Record<string, unknown> |
    null;

  sourceDraft:
    Record<string, unknown> |
    null;

  related:
    AdministrationListingRelatedSummary;
}

@Injectable({
  providedIn: 'root'
})
export class AdministrationListingsService {

  private readonly getListingsFunction =
    httpsCallable<
      void,
      GetAdministrationListingsResult
    >(
      functions,
      'getAdministrationListings'
    );

      private readonly getListingDetailsFunction =
    httpsCallable<
      {
        listingUid: string;

        recordType:
          AdministrationListingRecordType;
      },
      GetAdministrationListingDetailsResult
    >(
      functions,
      'getAdministrationListingDetails'
    );

  async getListings():
    Promise<GetAdministrationListingsResult> {
    try {
      const result =
        await this.getListingsFunction();

      return result.data;

    } catch (error: unknown) {
      console.error(
        'Administration listings could not be loaded.',
        error
      );

      if (
        error instanceof FunctionsError &&
        error.message
      ) {
        throw new Error(
          this.cleanFirebaseMessage(
            error.message
          )
        );
      }

      if (
        error instanceof Error &&
        error.message
      ) {
        throw error;
      }

      throw new Error(
        'NavStreet listings could not be loaded.'
      );
    }
  }

    async getListingDetails(
    listingUid: string,
    recordType:
      AdministrationListingRecordType
  ): Promise<GetAdministrationListingDetailsResult> {
    try {
      const result =
        await this.getListingDetailsFunction({
          listingUid,
          recordType
        });

      return result.data;
    } catch (error: unknown) {
      console.error(
        'Administration listing details could not be loaded.',
        error
      );

      if (
        error instanceof FunctionsError &&
        error.message
      ) {
        throw new Error(
          this.cleanFirebaseMessage(
            error.message
          )
        );
      }

      if (
        error instanceof Error &&
        error.message
      ) {
        throw error;
      }

      throw new Error(
        'The listing details could not be loaded.'
      );
    }
  }

  private cleanFirebaseMessage(
    message: string
  ): string {
    return message
      .replace(
        /^Firebase:\s*/i,
        ''
      )
      .replace(
        /\s*\(functions\/[^)]+\)\.?$/i,
        ''
      )
      .trim();
  }
}