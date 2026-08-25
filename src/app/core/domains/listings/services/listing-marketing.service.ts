import {
  Injectable
} from '@angular/core';

import {
  FunctionsError,
  HttpsCallableResult,
  httpsCallable
} from 'firebase/functions';

import {
  functions
} from '../../../infrastructure/firebase/firebase';

interface EnsureListingMarketingLinkRequest {
  listingUid: string;
}

export interface ListingMarketingLink {
  listingUid: string;
  shareCode: string;
  shortPath: string;
}

interface ResolveListingMarketingLinkRequest {
  shareCode: string;
}

export interface ResolvedListingMarketingLink {
  listingUid: string;
  listingPath: string;
}

interface GetMarketingChecklistRequest {
  listingUid: string;
}

interface UpdateMarketingChecklistRequest {
  listingUid: string;
  completedItems: string[];
}

export interface ListingMarketingChecklist {
  listingUid: string;
  completedItems: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ListingMarketingService {
  private readonly ensureLinkFunction =
    httpsCallable<
      EnsureListingMarketingLinkRequest,
      ListingMarketingLink
    >(
      functions,
      'ensureListingMarketingLink'
    );

  private readonly resolveLinkFunction =
    httpsCallable<
      ResolveListingMarketingLinkRequest,
      ResolvedListingMarketingLink
    >(
      functions,
      'resolveListingMarketingLink'
    );

  private readonly getChecklistFunction =
    httpsCallable<
      GetMarketingChecklistRequest,
      ListingMarketingChecklist
    >(
      functions,
      'getListingMarketingChecklist'
    );

  private readonly updateChecklistFunction =
    httpsCallable<
      UpdateMarketingChecklistRequest,
      ListingMarketingChecklist
    >(
      functions,
      'updateListingMarketingChecklist'
    );

  async ensureLink(
    listingUid: string
  ): Promise<ListingMarketingLink> {
    const normalizedListingUid =
      listingUid.trim();

    if (!normalizedListingUid) {
      throw new Error(
        'The listing could not be identified.'
      );
    }

    try {
      const result:
        HttpsCallableResult<
          ListingMarketingLink
        > =
        await this.ensureLinkFunction({
          listingUid:
            normalizedListingUid
        });

      return result.data;
    } catch (error: unknown) {
      console.error(
        'Unable to prepare listing marketing link:',
        error
      );

      throw new Error(
        this.getErrorMessage(
          error,
          'The listing marketing link could not be prepared.'
        )
      );
    }
  }

  async resolveLink(
    shareCode: string
  ): Promise<ResolvedListingMarketingLink> {
    const normalizedShareCode =
      shareCode
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9_-]/g,
          ''
        );

    if (!normalizedShareCode) {
      throw new Error(
        'The listing link is invalid.'
      );
    }

    try {
      const result:
        HttpsCallableResult<
          ResolvedListingMarketingLink
        > =
        await this.resolveLinkFunction({
          shareCode:
            normalizedShareCode
        });

      return result.data;
    } catch (error: unknown) {
      console.error(
        'Unable to resolve listing marketing link:',
        error
      );

      throw new Error(
        this.getErrorMessage(
          error,
          'This listing link is unavailable.'
        )
      );
    }
  }

  async getChecklist(
    listingUid: string
  ): Promise<ListingMarketingChecklist> {
    const normalizedListingUid =
      listingUid.trim();

    if (!normalizedListingUid) {
      throw new Error(
        'The listing could not be identified.'
      );
    }

    try {
      const result:
        HttpsCallableResult<
          ListingMarketingChecklist
        > =
        await this.getChecklistFunction({
          listingUid:
            normalizedListingUid
        });

      return result.data;
    } catch (error: unknown) {
      console.error(
        'Unable to load listing marketing checklist:',
        error
      );

      throw new Error(
        this.getErrorMessage(
          error,
          'The marketing checklist could not be loaded.'
        )
      );
    }
  }

  async updateChecklist(
    listingUid: string,
    completedItems: string[]
  ): Promise<ListingMarketingChecklist> {
    const normalizedListingUid =
      listingUid.trim();

    if (!normalizedListingUid) {
      throw new Error(
        'The listing could not be identified.'
      );
    }

    try {
      const result:
        HttpsCallableResult<
          ListingMarketingChecklist
        > =
        await this.updateChecklistFunction({
          listingUid:
            normalizedListingUid,

          completedItems
        });

      return result.data;
    } catch (error: unknown) {
      console.error(
        'Unable to save listing marketing checklist:',
        error
      );

      throw new Error(
        this.getErrorMessage(
          error,
          'The marketing checklist could not be saved.'
        )
      );
    }
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (error instanceof FunctionsError) {
      return this.cleanFirebaseMessage(
        error.message || fallback
      );
    }

    if (
      error instanceof Error &&
      error.message
    ) {
      return this.cleanFirebaseMessage(
        error.message
      );
    }

    return fallback;
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