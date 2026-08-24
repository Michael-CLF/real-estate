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

export interface AdministrationUser {
  uid: string;
  accountNumber: string | null;

  firstName: string;
  lastName: string;
  displayName: string;

  email: string;
  phone: string | null;
  photoURL: string | null;

  emailVerified: boolean;
  status: 'active' | 'disabled';

  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
}

export interface AdministrationUserSummary {
  totalUsers: number;
  activeUsers: number;
  disabledUsers: number;
  verifiedUsers: number;
}

export interface GetAdministrationUsersResult {
  users: AdministrationUser[];
  summary: AdministrationUserSummary;
}

@Injectable({
  providedIn: 'root'
})
export class AdministrationUsersService {

  private readonly getUsersFunction =
    httpsCallable<
      void,
      GetAdministrationUsersResult
    >(
      functions,
      'getAdministrationUsers'
    );

  async getUsers():
    Promise<GetAdministrationUsersResult> {
    try {
      const result =
        await this.getUsersFunction();

      return result.data;

    } catch (error: unknown) {
      console.error(
        'Administration users could not be loaded.',
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
        'NavStreet user accounts could not be loaded.'
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