import {
  Injectable
} from '@angular/core';

import {
  FunctionsError,
  httpsCallable
} from 'firebase/functions';

import {
  functions
} from '../../../infrastructure/firebase/firebase';


export type ListingDeletionRecordType =
  | 'draft'
  | 'published';


export interface ListingDeletionResult {
  success: true;

  requestedListingUid: string;

  recordType:
    ListingDeletionRecordType;

  deletedPublishedListings: number;
  deletedDrafts: number;
  deletedOffers: number;
  deletedContracts: number;
  deletedSavedListings: number;
  deletedInquiries: number;
  deletedInquiryRateLimits: number;
  deletedShowingRequests: number;
  deletedViewSessions: number;
  deletedMarketingLinks: number;
  deletedShareCodes: number;
  deletedShowingAvailability: number;
  deletedShowingSchedules: number;
  deletedTransactions: number;
  deletedStorageFiles: number;
}


@Injectable({
  providedIn: 'root'
})
export class ListingDeletionService {

  private readonly deleteListingFunction =
    httpsCallable<
      {
        listingUid: string;

        recordType:
          ListingDeletionRecordType;
      },
      ListingDeletionResult
    >(
      functions,
      'deleteListing'
    );


  async deleteListing(
    listingUid: string,
    recordType:
      ListingDeletionRecordType
  ): Promise<ListingDeletionResult> {
    try {
      const result =
        await this.deleteListingFunction({
          listingUid,
          recordType
        });

      return result.data;
    } catch (error: unknown) {
      console.error(
        'Listing deletion failed.',
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
        'The listing could not be deleted.'
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