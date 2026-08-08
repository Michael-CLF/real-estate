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


interface CreateIdentityVerificationSessionRequest {
  listingUid: string;
}


export interface CreateIdentityVerificationSessionResult {
  verificationSessionId: string;
  verificationUrl: string | null;

  status:
    | 'requires_input'
    | 'processing'
    | 'verified';

  alreadyVerified: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class IdentityVerificationService {

  private readonly createSessionFunction =
    httpsCallable<
      CreateIdentityVerificationSessionRequest,
      CreateIdentityVerificationSessionResult
    >(
      functions,
      'createIdentityVerificationSession'
    );


  async startVerification(
    listingUid: string
  ): Promise<CreateIdentityVerificationSessionResult> {

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
          CreateIdentityVerificationSessionResult
        > =
        await this.createSessionFunction({
          listingUid: normalizedListingUid
        });

      return result.data;
    } catch (error) {
      console.error(
        'Identity verification could not be started.',
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
        'Identity verification could not be started.'
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
      'Identity verification could not be started. ' +
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