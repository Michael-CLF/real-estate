import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
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

export const authGuard: CanActivateFn = (
  _route,
  state
) => {
  const authState = inject(AuthState);
  const router = inject(Router);

  /*
   * Firebase authentication is asynchronous when the
   * application first loads.
   *
   * Do not allow or deny the route until Firebase has
   * finished restoring the browser's authentication state.
   */
  return toObservable(authState.loading).pipe(
    filter(loading => !loading),
    take(1),

    map(() => {
      if (authState.isAuthenticated()) {
        return true;
      }

      return router.createUrlTree(
        ['/sign-in'],
        {
          queryParams: {
            returnUrl: state.url
          }
        }
      );
    })
  );
};