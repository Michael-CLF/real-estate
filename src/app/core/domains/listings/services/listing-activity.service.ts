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
  GetListingActivityRequest,
  GetListingActivityResponse
} from '../models/listing-activity.model';

@Injectable({
  providedIn: 'root'
})
export class ListingActivityService {
  private readonly getListingActivityFunction =
    httpsCallable<
      GetListingActivityRequest,
      GetListingActivityResponse
    >(
      functions,
      'getListingActivity'
    );

  async getListingActivity(
    listingUid: string
  ): Promise<GetListingActivityResponse> {
    const normalizedListingUid =
      listingUid.trim();

    if (!normalizedListingUid) {
      throw new Error(
        'A listing UID is required.'
      );
    }

    const result =
      await this.getListingActivityFunction({
        listingUid:
          normalizedListingUid
      });

    return result.data;
  }
}