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

export type AdministrationPaymentStatus =
  | 'pending'
  | 'paid'
  | 'no_payment_required'
  | 'failed'
  | 'unknown';

export interface AdministrationPaymentBreakdown {
  listingFee: number;
  featuredListingFee: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;

  promotionCode: string | null;
  promotionCodeUid: string | null;
  stripePromotionCodeId: string | null;
}

export interface AdministrationPayment {
  listingUid: string;
  publishedListingUid: string | null;
  sellerUid: string;

  propertyAddress: string;
  featuredListing: boolean;

  status:
    AdministrationPaymentStatus;

  stripePaymentStatus: string | null;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;

  breakdown:
    AdministrationPaymentBreakdown;

  checkoutCreatedAt: string | null;
  paidAt: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
}

export interface AdministrationPaymentSummary {
  totalTransactions: number;
  paidTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  noPaymentRequiredTransactions: number;

  grossAmount: number;
  discountAmount: number;
  collectedAmount: number;
}

export interface GetAdministrationPaymentsResult {
  payments:
    AdministrationPayment[];

  summary:
    AdministrationPaymentSummary;
}

@Injectable({
  providedIn: 'root'
})
export class AdministrationPaymentsService {

  private readonly getPaymentsFunction =
    httpsCallable<
      void,
      GetAdministrationPaymentsResult
    >(
      functions,
      'getAdministrationPayments'
    );

  async getPayments():
    Promise<GetAdministrationPaymentsResult> {
    try {
      const result =
        await this.getPaymentsFunction();

      return result.data;

    } catch (error: unknown) {
      console.error(
        'Administration payments could not be loaded.',
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
        'NavStreet payment records could not be loaded.'
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