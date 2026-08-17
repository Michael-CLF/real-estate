import {
  createHash,
} from 'node:crypto';

import * as logger from 'firebase-functions/logger';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  Timestamp,
} from 'firebase-admin/firestore';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  adminFirestore,
} from '../shared/firebase-admin';

interface RecordListingViewData {
  listingUid: string;
  visitorSessionUid?: string;
}

interface RecordListingViewResponse {
  listingUid: string;
  recorded: boolean;
  viewCount: number;
}

const VIEW_INTERVAL_MS =
  24 * 60 * 60 * 1000;

/**
 * Records one listing view per authenticated user or
 * anonymous browser session within a 24-hour period.
 */
export const recordListingView = onCall<
  RecordListingViewData,
  Promise<RecordListingViewResponse>
>(
  {
    ...callableFunctionOptions,

    /*
     * Public invocation is required because anonymous
     * visitors are valid listing viewers. All writes
     * remain controlled by this callable.
     */
    invoker: 'public',
  },
  async request => {
    const authenticatedUserUid =
      request.auth?.uid ?? null;

    const data =
      validateRequestData(
        request.data,
        authenticatedUserUid,
      );

    const viewerIdentity =
      authenticatedUserUid
        ? `user:${authenticatedUserUid}`
        : `session:${data.visitorSessionUid}`;

    const viewerIdentityHash =
      createHash('sha256')
        .update(viewerIdentity)
        .digest('hex');

    const viewDocumentUid =
      createHash('sha256')
        .update(
          `${data.listingUid}:${viewerIdentityHash}`,
        )
        .digest('hex');

    const listingReference =
      adminFirestore
        .collection('listings')
        .doc(data.listingUid);

    const viewReference =
      adminFirestore
        .collection(
          'listingViewSessions',
        )
        .doc(viewDocumentUid);

    let recorded = false;
    let viewCount = 0;

    try {
      await adminFirestore.runTransaction(
        async transaction => {
          const [
            listingSnapshot,
            viewSnapshot,
          ] = await Promise.all([
            transaction.get(
              listingReference,
            ),

            transaction.get(
              viewReference,
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
              'This listing is not currently available.',
            );
          }

          const sellerUid =
            readString(
              listingData[
              'sellerUid'
              ],
            );

          const currentViewCount =
            readNonNegativeInteger(
              listingData['views'],
              listingData['viewCount'],
            );

          viewCount =
            currentViewCount;

          /*
           * An authenticated seller viewing their own
           * listing must not affect its public metrics.
           */
          if (
            authenticatedUserUid &&
            sellerUid ===
            authenticatedUserUid
          ) {
            recorded = false;
            return;
          }

          const lastViewedAt =
            viewSnapshot.data()?.[
            'lastViewedAt'
            ];

          if (
            lastViewedAt instanceof
            Timestamp &&
            Date.now() -
            lastViewedAt.toMillis() <
            VIEW_INTERVAL_MS
          ) {
            recorded = false;
            return;
          }

          const now =
            Timestamp.now();

          viewCount =
            currentViewCount + 1;

          recorded = true;

          transaction.set(
            viewReference,
            {
              listingUid:
                data.listingUid,

              viewerIdentityHash,

              viewerType:
                authenticatedUserUid
                  ? 'authenticated'
                  : 'anonymous',

              viewerUid:
                authenticatedUserUid,

              lastViewedAt:
                now,

              updatedAt:
                now,
            },
            {
              merge: true,
            },
          );

          transaction.update(
            listingReference,
            {
              views:
                viewCount,
            },
          );
        },
      );
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        'Unable to record listing view.',
        {
          error,

          listingUid:
            data.listingUid,

          authenticatedUserUid,
        },
      );

      throw new HttpsError(
        'internal',
        'We could not record this listing view.',
      );
    }

    logger.info(
      'Listing view processed.',
      {
        listingUid:
          data.listingUid,

        authenticatedUserUid,
        recorded,
        viewCount,
      },
    );

    return {
      listingUid:
        data.listingUid,

      recorded,
      viewCount,
    };
  },
);

function validateRequestData(
  value: unknown,
  authenticatedUserUid:
    string | null,
): {
  listingUid: string;
  visitorSessionUid: string;
} {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'Listing view data is required.',
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

  const visitorSessionUid =
    readString(
      value[
      'visitorSessionUid'
      ],
    );

  if (
    !authenticatedUserUid &&
    (
      !visitorSessionUid ||
      visitorSessionUid.length > 128 ||
      !/^[a-zA-Z0-9_-]+$/.test(
        visitorSessionUid,
      )
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'A valid visitor session is required.',
    );
  }

  return {
    listingUid,
    visitorSessionUid,
  };
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