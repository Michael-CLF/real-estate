import {
  inject,
} from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

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
