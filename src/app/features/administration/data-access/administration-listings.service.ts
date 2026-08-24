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

export type AdministrationListingStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'active'
  | 'paused'
  | 'under_contract'
  | 'sold'
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

  title: string;
  propertyType: string;
  status: AdministrationListingStatus;

  price: number;
  featuredListing: boolean;

  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;

  address: AdministrationListingAddress;

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