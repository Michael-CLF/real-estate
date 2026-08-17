import {
  Injectable
} from '@angular/core';

import {
  httpsCallable
} from 'firebase/functions';

import {
  functions
} from '../../../infrastructure/firebase/firebase';

import {
  SellerControlledListingStatus,
  UpdateListingStatusRequest,
  UpdateListingStatusResponse
} from '../models/listing-status-management.model';

@Injectable({
  providedIn: 'root'
})
export class ListingStatusService {
  private readonly updateListingStatusFunction =
    httpsCallable<
      UpdateListingStatusRequest,
      UpdateListingStatusResponse
    >(
      functions,
      'updateListingStatus'
    );

  async updateListingStatus(
    listingUid: string,
    newStatus: SellerControlledListingStatus,
    reason = ''
  ): Promise<UpdateListingStatusResponse> {
    const normalizedListingUid =
      listingUid.trim();

    const normalizedReason =
      reason.trim();

    if (!normalizedListingUid) {
      throw new Error(
        'A listing UID is required.'
      );
    }

    if (
      newStatus === 'withdrawn' &&
      !normalizedReason
    ) {
      throw new Error(
        'A withdrawal reason is required.'
      );
    }

    if (
      normalizedReason.length > 500
    ) {
      throw new Error(
        'The status reason cannot exceed 500 characters.'
      );
    }

    const request:
      UpdateListingStatusRequest = {
      listingUid:
        normalizedListingUid,

      newStatus
    };

    if (normalizedReason) {
      request.reason =
        normalizedReason;
    }

    const result =
      await this.updateListingStatusFunction(
        request
      );

    return result.data;
  }
}