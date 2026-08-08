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


interface CreateListingCheckoutSessionRequest {
  listingUid: string;
}


export interface CreateListingCheckoutSessionResult {
  checkoutSessionId: string;
  checkoutUrl: string;
  totalAmount: number;
}


@Injectable({
  providedIn: 'root'
})
export class ListingPaymentService {

  private readonly createCheckoutSessionFunction =
    httpsCallable<
      CreateListingCheckoutSessionRequest,
      CreateListingCheckoutSessionResult
    >(
      functions,
      'createListingCheckoutSession'
    );


  async startCheckout(
    listingUid: string
  ): Promise<CreateListingCheckoutSessionResult> {

    const normalizedListingUid =
      listingUid.trim();

    if (!normalizedListingUid) {
      throw new Error(
        'The listing draft could not be identified.'
      );
    }

    try {
      const result:
        HttpsCallableResult<
          CreateListingCheckoutSessionResult
        > =
        await this.createCheckoutSessionFunction({
          listingUid: normalizedListingUid
        });

      if (!result.data.checkoutUrl) {
        throw new Error(
          'Stripe did not return a secure payment URL.'
        );
      }

      return result.data;
    } catch (error) {
      console.error(
        'Stripe Checkout could not be started.',
        error
      );

      throw new Error(
        this.getErrorMessage(error)
      );
    }
  }


  private getErrorMessage(
    error: unknown
  ): string {

    if (error instanceof FunctionsError) {
      return this.cleanFirebaseMessage(
        error.message ||
        'The secure payment page could not be opened.'
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

    return (
      'The secure payment page could not be opened. ' +
      'Please try again.'
    );
  }


  private cleanFirebaseMessage(
    message: string
  ): string {

    return message
      .replace(/^Firebase:\s*/i, '')
      .replace(
        /\s*\(functions\/[^)]+\)\.?$/i,
        ''
      )
      .trim();
  }
}