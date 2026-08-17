import * as logger from 'firebase-functions/logger';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  adminFirestore,
} from '../shared/firebase-admin';

interface SaveMarketplaceListingData {
  listingUid: string;
}

interface SaveMarketplaceListingResponse {
  listingUid: string;
  isSaved: true;
  favoriteCount: number;
}

export const saveMarketplaceListing = onCall<
  SaveMarketplaceListingData,
  Promise<SaveMarketplaceListingResponse>
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
        'Sign in before saving a listing.',
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

          if (!listingSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The selected listing could not be found.',
            );
          }

          const listingData =
            listingSnapshot.data();

          if (!listingData) {
            throw new HttpsError(
              'not-found',
              'The selected listing contains no data.',
            );
          }

          if (
            listingData['status'] !==
            'active'
          ) {
            throw new HttpsError(
              'failed-precondition',
              'This listing is not currently available to save.',
            );
          }

          const currentFavoriteCount =
            readNonNegativeInteger(
              listingData['favorites'],
              listingData[
              'favoriteCount'
              ],
            );

          /*
           * Saving an already-saved listing must not
           * increment the public counter again.
           */
          if (
            savedListingSnapshot.exists
          ) {
            favoriteCount =
              currentFavoriteCount;

            return;
          }

          favoriteCount =
            currentFavoriteCount + 1;

          transaction.create(
            savedListingReference,
            {
              listingUid,

              sellerUid:
                readString(
                  listingData[
                  'sellerUid'
                  ],
                ),

              address:
                readString(
                  listingData[
                  'addressLine1'
                  ],
                ),

              city:
                readString(
                  listingData['city'],
                ),

              state:
                readString(
                  listingData['state'],
                ),

              price:
                readNumber(
                  listingData[
                  'listPrice'
                  ],
                ) ?? 0,

              primaryPhotoUrl:
                readNullableString(
                  listingData[
                  'primaryPhotoUrl'
                  ],
                ),

              daysOnMarket:
                calculateDaysOnMarket(
                  listingData[
                  'publishedAt'
                  ],
                ),

              createdAt:
                FieldValue
                  .serverTimestamp(),
            },
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
        'Unable to save marketplace listing.',
        {
          error,
          listingUid,
          userUid,
        },
      );

      throw new HttpsError(
        'internal',
        'We could not save this listing. Please try again.',
      );
    }

    logger.info(
      'Marketplace listing saved.',
      {
        listingUid,
        userUid,
        favoriteCount,
      },
    );

    return {
      listingUid,
      isSaved: true,
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

function calculateDaysOnMarket(
  publishedAt: unknown,
): number {
  if (
    !(publishedAt instanceof Timestamp)
  ) {
    return 0;
  }

  const millisecondsPerDay =
    1000 * 60 * 60 * 24;

  const elapsedMilliseconds =
    Date.now() -
    publishedAt.toMillis();

  return Math.max(
    0,
    Math.floor(
      elapsedMilliseconds /
      millisecondsPerDay,
    ),
  );
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

function readNullableString(
  value: unknown,
): string | null {
  const normalizedValue =
    readString(value);

  return normalizedValue || null;
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