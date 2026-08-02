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

export const accountGuard: CanActivateFn = (
  _route,
  state
) => {
  const authState = inject(AuthState);
  const accountState = inject(AccountState);
  const router = inject(Router);

  return combineLatest([
    toObservable(authState.loading),
    toObservable(accountState.loading)
  ]).pipe(
    /*
     * Do not make a routing decision until both Firebase
     * Authentication and the NavStreet account lookup
     * have completed.
     */
    filter(
      ([authLoading, accountLoading]) =>
        !authLoading &&
        !accountLoading
    ),

    take(1),

    map(() => {
      /*
       * No Firebase session.
       *
       * Send the visitor to sign-in and preserve exactly
       * where they were trying to go.
       */
      if (!authState.isAuthenticated()) {
        return router.createUrlTree(
          ['/sign-in'],
          {
            queryParams: {
              returnUrl: state.url
            }
          }
        );
      }

      /*
       * Firebase authenticated, but the NavStreet
       * profile lookup itself failed.
       *
       * Do not grant account access when account state
       * cannot be verified.
       */
      if (accountState.error()) {
        return router.createUrlTree(
          ['/']
        );
      }

      /*
       * Firebase authenticated but there is no
       * /users/{uid} NavStreet account.
       *
       * Send this user through registration so the
       * incomplete account can be repaired.
       */
      if (accountState.hasIncompleteAccount()) {
        return router.createUrlTree(
          ['/register'],
          {
            queryParams: {
              returnUrl: state.url
            }
          }
        );
      }

      /*
       * The NavStreet account exists but has been
       * disabled.
       */
      if (
        accountState.hasAccount() &&
        !accountState.isActive()
      ) {
        return router.createUrlTree(
          ['/']
        );
      }

      /*
       * Valid authenticated NavStreet account.
       */
      if (accountState.isActive()) {
        return true;
      }

      /*
       * Fail closed for any state we did not explicitly
       * recognize.
       */
      return router.createUrlTree(
        ['/']
      );
    })
  );
};