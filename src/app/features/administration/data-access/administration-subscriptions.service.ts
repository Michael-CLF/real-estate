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

export interface AdministrationSubscription {
  professionalUid: string;
  ownerUid: string;

  businessName: string;
  email: string;
  stateName: string;
  stateAbbreviation: string;

  profileStatus:
    | 'free'
    | 'profile';

  businessStatus:
    | 'active'
    | 'suspended'
    | 'removed';

  stripeSubscriptionStatus: string;

  stripeCheckoutSessionId:
    string | null;

  stripeCustomerId:
    string | null;

  stripeSubscriptionId:
    string | null;

  cancelAtPeriodEnd: boolean;

  activatedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdministrationSubscriptionSummary {
  totalSubscriptionRecords: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  canceledSubscriptions: number;
  incompleteSubscriptions: number;
  cancelScheduledSubscriptions: number;
}

export interface GetAdministrationSubscriptionsResult {
  subscriptions:
    AdministrationSubscription[];

  summary:
    AdministrationSubscriptionSummary;
}

@Injectable({
  providedIn: 'root'
})
export class AdministrationSubscriptionsService {

  private readonly getSubscriptionsFunction =
    httpsCallable<
      void,
      GetAdministrationSubscriptionsResult
    >(
      functions,
      'getAdministrationSubscriptions'
    );

  async getSubscriptions():
    Promise<GetAdministrationSubscriptionsResult> {
    try {
      const result =
        await this.getSubscriptionsFunction();

      return result.data;

    } catch (error: unknown) {
      console.error(
        'Administration subscriptions could not be loaded.',
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
        'NavStreet subscriptions could not be loaded.'
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