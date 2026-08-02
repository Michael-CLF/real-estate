import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  combineLatest,
  filter,
  map,
  take
} from 'rxjs';

import {
  toObservable
} from '@angular/core/rxjs-interop';

import {
  AuthState
} from '../state/auth.state';

import {
  AccountState
} from '../state/account.state';

export const guestGuard: CanActivateFn = (
  route
) => {
  const authState = inject(AuthState);
  const accountState = inject(AccountState);
  const router = inject(Router);

  return combineLatest([
    toObservable(authState.loading),
    toObservable(accountState.loading)
  ]).pipe(
    /*
     * Wait until Firebase Authentication and the
     * NavStreet account lookup have both completed.
     */
    filter(
      ([authLoading, accountLoading]) =>
        !authLoading &&
        !accountLoading
    ),

    take(1),

    map(() => {
      /*
       * A signed-out visitor may access both
       * registration and sign-in.
       */
      if (authState.isSignedOut()) {
        return true;
      }

      /*
       * Firebase authentication exists but there is no
       * NavStreet profile.
       *
       * This is an incomplete account.
       *
       * Allow access to /register so registration can
       * repair/complete the account.
       */
      if (
        accountState.hasIncompleteAccount() &&
        route.routeConfig?.path === 'register'
      ) {
        return true;
      }

      /*
       * A Firebase-authenticated user without a valid
       * NavStreet account should not use the normal
       * sign-in page.
       *
       * Send them to registration to complete their
       * account.
       */
      if (accountState.hasIncompleteAccount()) {
        return router.createUrlTree(
          ['/register'],
          {
            queryParams: {
              returnUrl:
                route.queryParamMap.get('returnUrl') ??
                '/dashboard'
            }
          }
        );
      }

      /*
       * A complete active NavStreet account does not
       * need registration or sign-in.
       */
      if (accountState.isActive()) {
        return router.createUrlTree([
          '/dashboard'
        ]);
      }

      /*
       * If account state could not be established,
       * fail closed rather than granting access to
       * authenticated account functionality.
       */
      return router.createUrlTree([
        '/'
      ]);
    })
  );
};