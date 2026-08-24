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

export type AdministrationBusinessStatus =
  | 'active'
  | 'suspended'
  | 'removed';

export type AdministrationBusinessSubscription =
  | 'free'
  | 'profile';

export interface AdministrationBusiness {
  uid: string;
  ownerUid: string;

  businessName: string;
  category: string;
  professionalType: string;
  specialties: string[];

  stateName: string;
  stateAbbreviation: string;
  stateSlug: string;

  serviceAreaType:
    | 'statewide'
    | 'counties'
    | 'cities';

  counties: string[];
  cities: string[];

  phone: string;
  email: string;

  subscriptionStatus:
    AdministrationBusinessSubscription;

  placement:
    | 'standard'
    | 'sponsored';

  profileSlug: string | null;
  website: string | null;
  logoUrl: string | null;

  submissionCertified: boolean;

  status:
    AdministrationBusinessStatus;

  createdAt: string | null;
  updatedAt: string | null;
}

export interface AdministrationBusinessSummary {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  removedBusinesses: number;
  profileSubscribers: number;
  sponsoredBusinesses: number;
}

export interface GetAdministrationBusinessesResult {
  businesses:
    AdministrationBusiness[];

  summary:
    AdministrationBusinessSummary;
}

@Injectable({
  providedIn: 'root'
})
export class AdministrationBusinessesService {

  private readonly getBusinessesFunction =
    httpsCallable<
      void,
      GetAdministrationBusinessesResult
    >(
      functions,
      'getAdministrationBusinesses'
    );

  async getBusinesses():
    Promise<GetAdministrationBusinessesResult> {
    try {
      const result =
        await this.getBusinessesFunction();

      return result.data;

    } catch (error: unknown) {
      console.error(
        'Administration businesses could not be loaded.',
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
        'NavStreet businesses could not be loaded.'
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