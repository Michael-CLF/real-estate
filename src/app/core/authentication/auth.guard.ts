import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthState } from '../authentication/auth.state';

export const authGuard: CanActivateFn = (_route, state) => {

  const authState = inject(AuthState);
  const router = inject(Router);

  if (authState.loading()) {
    return false;
  }

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
};