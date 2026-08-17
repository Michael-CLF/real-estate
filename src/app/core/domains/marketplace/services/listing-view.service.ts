import {
  Injectable,
  PLATFORM_ID,
  inject
} from '@angular/core';

import {
  isPlatformBrowser
} from '@angular/common';

import {
  httpsCallable
} from 'firebase/functions';

import {
  functions
} from '../../../infrastructure/firebase/firebase';

interface RecordListingViewRequest {
  listingUid: string;
  visitorSessionUid: string;
}

export interface RecordListingViewResponse {
  listingUid: string;
  recorded: boolean;
  viewCount: number;
}

const VIEW_SESSION_STORAGE_KEY =
  'navstreet_listing_view_session_uid';

@Injectable({
  providedIn: 'root'
})
export class ListingViewService {
  private readonly platformId =
    inject(PLATFORM_ID);

  private readonly recordListingViewFunction =
    httpsCallable<
      RecordListingViewRequest,
      RecordListingViewResponse
    >(
      functions,
      'recordListingView'
    );

  async recordListingView(
    listingUid: string
  ): Promise<RecordListingViewResponse> {
    const normalizedListingUid =
      listingUid.trim();

    if (!normalizedListingUid) {
      throw new Error(
        'A listing UID is required.'
      );
    }

    const result =
      await this.recordListingViewFunction({
        listingUid:
          normalizedListingUid,

        visitorSessionUid:
          this.getVisitorSessionUid()
      });

    return result.data;
  }

  private getVisitorSessionUid():
    string {
    if (
      !isPlatformBrowser(
        this.platformId
      )
    ) {
      return this.createSessionUid();
    }

    try {
      const existingSessionUid =
        localStorage
          .getItem(
            VIEW_SESSION_STORAGE_KEY
          )
          ?.trim() ?? '';

      if (existingSessionUid) {
        return existingSessionUid;
      }

      const sessionUid =
        this.createSessionUid();

      localStorage.setItem(
        VIEW_SESSION_STORAGE_KEY,
        sessionUid
      );

      return sessionUid;
    } catch {
      /*
       * Browser privacy settings may make localStorage
       * unavailable. A temporary valid identifier still
       * allows the view request to complete.
       */
      return this.createSessionUid();
    }
  }

  private createSessionUid():
    string {
    if (
      typeof globalThis.crypto
        ?.randomUUID === 'function'
    ) {
      return globalThis.crypto
        .randomUUID();
    }

    return (
      `${Date.now().toString(36)}_` +
      Math.random()
        .toString(36)
        .slice(2, 14)
    );
  }
}