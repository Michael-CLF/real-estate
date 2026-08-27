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

import {
  ListingTransaction,
  SaveListingTransactionTask
} from '../models/listing-transaction.model';

interface ListingTransactionRequest {
  listingUid: string;
}

interface SaveListingTransactionRequest {
  listingUid: string;
  tasks: SaveListingTransactionTask[];
}

@Injectable({
  providedIn: 'root'
})
export class ListingTransactionService {

  private readonly getTransactionFunction =
    httpsCallable<
      ListingTransactionRequest,
      ListingTransaction
    >(
      functions,
      'getListingTransaction'
    );

  private readonly saveTransactionFunction =
    httpsCallable<
      SaveListingTransactionRequest,
      ListingTransaction
    >(
      functions,
      'saveListingTransaction'
    );

  async getTransaction(
    listingUid: string
  ): Promise<ListingTransaction> {

    const normalizedListingUid =
      this.requireListingUid(
        listingUid
      );

    try {
      const result =
        await this.getTransactionFunction({
          listingUid:
            normalizedListingUid
        });

      return result.data;

    } catch (error: unknown) {
      console.error(
        'Unable to load contract timeline:',
        error
      );

      throw new Error(
        this.getErrorMessage(
          error,
          'The contract timeline could not be loaded.'
        )
      );
    }
  }

  async saveTransaction(
    listingUid: string,
    tasks: SaveListingTransactionTask[]
  ): Promise<ListingTransaction> {

    const normalizedListingUid =
      this.requireListingUid(
        listingUid
      );

    try {
      const result =
        await this.saveTransactionFunction({
          listingUid:
            normalizedListingUid,

          tasks
        });

      return result.data;

    } catch (error: unknown) {
      console.error(
        'Unable to save contract timeline:',
        error
      );

      throw new Error(
        this.getErrorMessage(
          error,
          'The contract timeline could not be saved.'
        )
      );
    }
  }

  private requireListingUid(
    listingUid: string
  ): string {

    const normalizedListingUid =
      listingUid.trim();

    if (!normalizedListingUid) {
      throw new Error(
        'The selected listing could not be identified.'
      );
    }

    return normalizedListingUid;
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {

    if (error instanceof FunctionsError) {
      return (
        error.message ||
        fallback
      );
    }

    if (
      error instanceof Error &&
      error.message
    ) {
      return error.message;
    }

    return fallback;
  }
}