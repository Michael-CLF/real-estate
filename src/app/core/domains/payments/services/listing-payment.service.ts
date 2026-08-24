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

  promotionCode?:
    string |
    null;
}

export interface CreateListingCheckoutSessionResult {
  checkoutSessionId: string;
  checkoutUrl: string;
  totalAmount: number;
}

interface ValidateListingPromotionRequest {
  listingUid: string;
  code: string;
}

export interface ValidateListingPromotionResult {
  valid: true;

  code: string;

  stripePromotionCodeId:
    string;

  listingFeeCents:
    number;

  featuredListingFeeCents:
    number;

  subtotalAmountCents:
    number;

  discountAmountCents:
    number;

  totalAmountCents:
    number;
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

  private readonly validatePromotionFunction =
    httpsCallable<
      ValidateListingPromotionRequest,
      ValidateListingPromotionResult
    >(
      functions,
      'validateListingPromotion'
    );

  async validatePromotion(
    listingUid: string,
    code: string
  ): Promise<ValidateListingPromotionResult> {
    const normalizedListingUid =
      listingUid.trim();

    const normalizedCode =
      code
        .trim()
        .toUpperCase()
        .replace(
          /[^A-Z0-9]/g,
          ''
        );

    if (!normalizedListingUid) {
      throw new Error(
        'The listing draft could not be identified.'
      );
    }

    if (!normalizedCode) {
      throw new Error(
        'Enter a promotion code.'
      );
    }

    try {
      const result:
        HttpsCallableResult<
          ValidateListingPromotionResult
        > =
        await this.validatePromotionFunction({
          listingUid:
            normalizedListingUid,

          code:
            normalizedCode
        });

      return result.data;
    } catch (error) {
      console.error(
        'The promotion code could not be validated.',
        error
      );

      throw new Error(
        this.getErrorMessage(
          error,
          'The promotion code could not be validated.'
        )
      );
    }
  }

  async startCheckout(
    listingUid: string,
    promotionCode?:
      string |
      null
  ): Promise<CreateListingCheckoutSessionResult> {
    const normalizedListingUid =
      listingUid.trim();

    const normalizedPromotionCode =
      promotionCode
        ?.trim()
        .toUpperCase()
        .replace(
          /[^A-Z0-9]/g,
          ''
        ) ?? '';

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
          listingUid:
            normalizedListingUid,

          promotionCode:
            normalizedPromotionCode ||
            null
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
        this.getErrorMessage(
          error,
          'The secure payment page could not be opened.'
        )
      );
    }
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (
      error instanceof
      FunctionsError
    ) {
      return this.cleanFirebaseMessage(
        error.message ||
        fallback
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
      fallback +
      ' Please try again.'
    );
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