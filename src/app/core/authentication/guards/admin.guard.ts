import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  User,
  getIdTokenResult,
  onAuthStateChanged
} from 'firebase/auth';

import {
  auth
} from '../../infrastructure/firebase/firebase';

/**
 * Restricts administration routes to Firebase users
 * carrying either:
 *
 * - admin: true
 * - role: 'admin'
 */
export const adminGuard: CanActivateFn =
  async () => {
    const router = inject(Router);

    const authenticatedUser =
      await waitForAuthenticatedUser();

    if (!authenticatedUser) {
      return router.createUrlTree([
        '/sign-in'
      ]);
    }

    try {
      const tokenResult =
        await getIdTokenResult(
          authenticatedUser,
          true
        );

      const isAdministrator =
        tokenResult.claims['admin'] === true ||
        tokenResult.claims['role'] === 'admin';

      if (isAdministrator) {
        return true;
      }

      console.warn(
        'Administration access denied:',
        authenticatedUser.uid
      );

      return router.createUrlTree([
        '/dashboard'
      ]);

    } catch (error: unknown) {
      console.error(
        'Unable to verify administrator access:',
        error
      );

      return router.createUrlTree([
        '/dashboard'
      ]);
    }
  };

function waitForAuthenticatedUser():
  Promise<User | null> {
  return new Promise(resolve => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        user => {
          unsubscribe();
          resolve(user);
        },
        error => {
          unsubscribe();

          console.error(
            'Unable to determine authentication state:',
            error
          );

          resolve(null);
        }
      );
  });
}