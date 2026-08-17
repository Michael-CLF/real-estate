import * as logger from 'firebase-functions/logger';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  FieldValue,
} from 'firebase-admin/firestore';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  adminFirestore,
} from '../shared/firebase-admin';

interface RemoveSavedMarketplaceListingData {
  listingUid: string;
}

interface RemoveSavedMarketplaceListingResponse {
  listingUid: string;
  isSaved: false;
  favoriteCount: number;
}

export const removeSavedMarketplaceListing = onCall<
  RemoveSavedMarketplaceListingData,
  Promise<RemoveSavedMarketplaceListingResponse>
>(
  {
    ...callableFunctionOptions,
  },

  async request => {
    const userUid =
      request.auth?.uid;

    if (!userUid) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in before removing a saved listing.',
      );
    }

    const listingUid =
      validateListingUid(
        request.data,
      );

    const listingReference =
      adminFirestore
        .collection('listings')
        .doc(listingUid);

    const savedListingReference =
      adminFirestore
        .collection('users')
        .doc(userUid)
        .collection('savedListings')
        .doc(listingUid);

    let favoriteCount = 0;

    try {
      await adminFirestore.runTransaction(
        async transaction => {
          const [
            listingSnapshot,
            savedListingSnapshot,
          ] = await Promise.all([
            transaction.get(
              listingReference,
            ),

            transaction.get(
              savedListingReference,
            ),
          ]);

          /*
           * Removing an already-removed saved listing
           * is intentionally idempotent.
           */
          if (
            !savedListingSnapshot.exists
          ) {
            if (
              listingSnapshot.exists
            ) {
              favoriteCount =
                readNonNegativeInteger(
                  listingSnapshot.data()?.[
                    'favorites'
                  ],

                  listingSnapshot.data()?.[
                    'favoriteCount'
                  ],
                );
            }

            return;
          }

          /*
           * Users must still be able to remove a saved
           * summary if the public listing no longer exists.
           */
          if (!listingSnapshot.exists) {
            transaction.delete(
              savedListingReference,
            );

            favoriteCount = 0;
            return;
          }

          const listingData =
            listingSnapshot.data();

          const currentFavoriteCount =
            readNonNegativeInteger(
              listingData?.[
                'favorites'
              ],

              listingData?.[
                'favoriteCount'
              ],
            );

          favoriteCount =
            Math.max(
              0,
              currentFavoriteCount - 1,
            );

          transaction.delete(
            savedListingReference,
          );

          transaction.update(
            listingReference,
            {
              favorites:
                favoriteCount,

              updatedAt:
                FieldValue
                  .serverTimestamp(),
            },
          );
        },
      );
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        'Unable to remove saved marketplace listing.',
        {
          error,
          listingUid,
          userUid,
        },
      );

      throw new HttpsError(
        'internal',
        'We could not remove this saved listing. Please try again.',
      );
    }

    logger.info(
      'Saved marketplace listing removed.',
      {
        listingUid,
        userUid,
        favoriteCount,
      },
    );

    return {
      listingUid,
      isSaved: false,
      favoriteCount,
    };
  },
);

function validateListingUid(
  value: unknown,
): string {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'A listing UID is required.',
    );
  }

  const listingUid =
    readString(
      value['listingUid'],
    );

  if (
    !listingUid ||
    listingUid.length > 128
  ) {
    throw new HttpsError(
      'invalid-argument',
      'A valid listing UID is required.',
    );
  }

  return listingUid;
}

function readNonNegativeInteger(
  primaryValue: unknown,
  fallbackValue?: unknown,
): number {
  const value =
    readNumber(primaryValue) ??
    readNumber(fallbackValue) ??
    0;

  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    return 0;
  }

  return value;
}

function readNumber(
  value: unknown,
): number | null {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
    ? value
    : null;
}

function readString(
  value: unknown,
): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}