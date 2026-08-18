import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  catchError,
  filter,
  from,
  map,
  of,
  switchMap,
  take
} from 'rxjs';

import {
  toObservable
} from '@angular/core/rxjs-interop';

import {
  AuthState
} from '../../../authentication/state/auth.state';

import {
  FirestoreOfferRepository
} from '../repositories/firestore-offer.repository';


/*
 * Protects routes that display an existing offer.
 *
 * Access is granted only when the authenticated user is a
 * buyer or seller recorded on that offer.
 */
export const offerAccessGuard:
  CanActivateFn = (
    route,
    state
  ) => {
    const authState =
      inject(AuthState);

    const router =
      inject(Router);

    const offerRepository =
      inject(FirestoreOfferRepository);

    return toObservable(
      authState.loading
    ).pipe(
      filter(
        loading =>
          !loading
      ),

      take(1),

      switchMap(
        () => {
          const userUid =
            authState.uid();

          if (!userUid) {
            return of(
              router.createUrlTree(
                ['/sign-in'],
                {
                  queryParams: {
                    returnUrl:
                      state.url
                  }
                }
              )
            );
          }

          const offerUid =
            route.paramMap.get(
              'offerUid'
            );

          if (!offerUid) {
            return of(
              router.createUrlTree(
                ['/dashboard']
              )
            );
          }

          return from(
            offerRepository
              .getOfferByUid(
                offerUid
              )
          ).pipe(
            map(
              offer => {
                if (!offer) {
                  return router
                    .createUrlTree(
                      ['/dashboard'],
                      {
                        queryParams: {
                          offerError:
                            'not-found'
                        }
                      }
                    );
                }

                const isBuyer =
                  offer.buyerUids
                    .includes(
                      userUid
                    );

                const isSeller =
                  offer.sellerUids
                    .includes(
                      userUid
                    );

                if (
                  isBuyer ||
                  isSeller
                ) {
                  return true;
                }

                return router
                  .createUrlTree(
                    ['/dashboard'],
                    {
                      queryParams: {
                        offerError:
                          'access-denied'
                      }
                    }
                  );
              }
            ),

            catchError(
              () =>
                of(
                  router.createUrlTree(
                    ['/dashboard'],
                    {
                      queryParams: {
                        offerError:
                          'load-failed'
                      }
                    }
                  )
                )
            )
          );
        }
      )
    );
  };