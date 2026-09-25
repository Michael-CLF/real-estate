import {
  Injectable,
} from '@angular/core';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import {
  httpsCallable,
} from 'firebase/functions';

import {
  auth,
  firestore,
  functions,
} from '../../../infrastructure/firebase/firebase';


export type OfferIdentityVerificationStatus =
  | 'not_started'
  | 'requires_input'
  | 'processing'
  | 'verified'
  | 'canceled';


export interface OfferIdentityVerificationResult {
  verificationSessionId: string | null;
  verificationUrl: string | null;
  status:
    | 'requires_input'
    | 'processing'
    | 'verified';
  alreadyVerified: boolean;
}


interface CreateOfferIdentityVerificationSessionRequest {
  listingUid: string;
  returnBaseUrl: string;
  returnPath: string;
}


interface UserIdentityDocument {
  identityStatus?: string;
  identityVerificationStatus?: string;
  verifiedFirstName?: string;
  verifiedLastName?: string;
}


@Injectable({
  providedIn: 'root',
})
export class OfferIdentityVerificationService {
  private readonly createVerificationSession =
    httpsCallable<
      CreateOfferIdentityVerificationSessionRequest,
      OfferIdentityVerificationResult
    >(
      functions,
      'createOfferIdentityVerificationSession'
    );


  async getStatus():
    Promise<OfferIdentityVerificationStatus> {
    const user =
      auth.currentUser;

    if (!user) {
      return 'not_started';
    }

    const snapshot =
      await getDoc(
        doc(
          firestore,
          'users',
          user.uid
        )
      );

    if (!snapshot.exists()) {
      return 'not_started';
    }

    const account =
      snapshot.data() as
        UserIdentityDocument;

    if (
      account.identityStatus ===
        'verified' ||
      account.identityVerificationStatus ===
        'verified' ||
      (
        Boolean(
          account.verifiedFirstName
            ?.trim()
        ) &&
        Boolean(
          account.verifiedLastName
            ?.trim()
        )
      )
    ) {
      return 'verified';
    }

    return this.normalizeStatus(
      account.identityStatus ??
      account.identityVerificationStatus
    );
  }


  async isVerified(): Promise<boolean> {
    return (
      await this.getStatus()
    ) === 'verified';
  }


  async startVerification(
    listingUid: string,
    returnPath: string
  ): Promise<OfferIdentityVerificationResult> {
    const response =
      await this.createVerificationSession({
        listingUid,
        returnBaseUrl:
          window.location.origin,
        returnPath,
      });

    return response.data;
  }


  isValidOfferReturnPath(
    returnPath: string,
    listingUid: string
  ): boolean {
    const expectedPath =
      `/listings/${listingUid}/offer`;

    const newPath = `/listings/${listingUid}/offers/new`;
    return (
      returnPath === newPath ||
      returnPath.startsWith(`${newPath}?`) ||
      returnPath === expectedPath ||
      returnPath.startsWith(
        `${expectedPath}?`
      )
    );
  }


  private normalizeStatus(
    status: string | undefined
  ): OfferIdentityVerificationStatus {
    switch (status) {
      case 'requires_input':
      case 'processing':
      case 'verified':
      case 'canceled':
        return status;

      default:
        return 'not_started';
    }
  }
}
