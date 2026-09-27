import {
  inject,
} from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { firstValueFrom, filter, take } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

import { AuthState } from '../../../authentication/state/auth.state';

import {
  OfferIdentityVerificationService,
} from '../services/offer-identity-verification.service';


export const offerIdentityGuard:
  CanActivateFn =
  async (
    route,
    state
  ) => {
    const router =
      inject(Router);

    const authState = inject(AuthState);

    const identityService =
      inject(
        OfferIdentityVerificationService
      );

    const listingUid =
      route.paramMap.get(
        'listingUid'
      );

    if (!listingUid) {
      return router.createUrlTree([
        '/homes',
      ]);
    }

    // Angular may start sibling route guards at the same time. Wait for
    // Firebase to restore the signed-in user before checking identity or
    // invoking the session-start callable.
    await firstValueFrom(
      toObservable(authState.loading).pipe(
        filter(loading => !loading),
        take(1)
      )
    );

    if (!authState.isAuthenticated()) {
      return router.createUrlTree(['/sign-in'], {
        queryParams: { returnUrl: state.url },
      });
    }

    const returnRoute = [
      '/listings',
      listingUid,
      'offer',
      'verification-return',
    ];

    try {
      if (
        await identityService
          .isVerified()
      ) {
        return true;
      }

      const verification =
        await identityService
          .startVerification(
            listingUid,
            state.url
          );

      if (
        verification.alreadyVerified ||
        verification.status ===
          'verified'
      ) {
        return true;
      }

      if (
        verification.verificationUrl
      ) {
        window.location.assign(
          verification.verificationUrl
        );

        return false;
      }

      return router.createUrlTree(
        returnRoute,
        {
          queryParams: {
            returnUrl:
              state.url,
          },
        }
      );
    } catch (error) {
      console.error(
        'Offer identity verification could not be started.',
        error
      );

      return router.createUrlTree(
        returnRoute,
        {
          queryParams: {
            returnUrl:
              state.url,
            startError: 'true',
          },
        }
      );
    }
  };