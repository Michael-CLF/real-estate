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

type ListingInquiryStatus =
  | 'new'
  | 'read';

type ListingInquiryActivityPerspective =
  | 'sent'
  | 'received';

interface ListingInquiryActivityResponse {
  inquiryUid: string;
  inquiryReferenceNumber: string;
  listingUid: string;

  perspective:
    ListingInquiryActivityPerspective;

  status:
    ListingInquiryStatus;

  buyerName: string;
  propertyAddress: string;

  createdAt: string;
  readAt: string | null;
}

interface GetUserInquiryActivityResponse {
  activities:
    ListingInquiryActivityResponse[];
}

const MAXIMUM_ACTIVITY_ITEMS = 20;

/**
 * Returns recent sent and received inquiry activity
 * for the authenticated universal dashboard user.
 */
export const getUserInquiryActivity = onCall<
  Record<string, never>,
  Promise<GetUserInquiryActivityResponse>
>(
  {
    ...callableFunctionOptions,
  },

  async request => {
    const currentUserUid =
      request.auth?.uid;

    if (!currentUserUid) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in before loading recent activity.',
      );
    }

    try {
      const inquiryCollection =
        adminFirestore.collection(
          'listingInquiries',
        );

      const [
        sentSnapshot,
        receivedSnapshot,
      ] = await Promise.all([
        inquiryCollection
          .where(
            'buyerUid',
            '==',
            currentUserUid,
          )
          .limit(
            MAXIMUM_ACTIVITY_ITEMS,
          )
          .get(),

        inquiryCollection
          .where(
            'sellerUid',
            '==',
            currentUserUid,
          )
          .limit(
            MAXIMUM_ACTIVITY_ITEMS,
          )
          .get(),
      ]);

      const activityByInquiryUid =
        new Map<
          string,
          ListingInquiryActivityResponse
        >();

      for (
        const document of
        sentSnapshot.docs
      ) {
        activityByInquiryUid.set(
          document.id,

          createActivityResponse(
            document.id,
            document.data(),
            'sent',
          ),
        );
      }

      for (
        const document of
        receivedSnapshot.docs
      ) {
        activityByInquiryUid.set(
          document.id,

          createActivityResponse(
            document.id,
            document.data(),
            'received',
          ),
        );
      }

      const activities =
        Array.from(
          activityByInquiryUid.values(),
        )
          .sort(
            (
              firstActivity,
              secondActivity,
            ) =>
              Date.parse(
                secondActivity.createdAt,
              ) -
              Date.parse(
                firstActivity.createdAt,
              )
          )
          .slice(
            0,
            MAXIMUM_ACTIVITY_ITEMS,
          );

      logger.info(
        'User inquiry activity loaded.',
        {
          currentUserUid,

          sentCount:
            sentSnapshot.size,

          receivedCount:
            receivedSnapshot.size,

          returnedCount:
            activities.length,
        },
      );

      return {
        activities,
      };
    } catch (error: unknown) {
      logger.error(
        'Unable to load user inquiry activity.',
        {
          error,
          currentUserUid,
        },
      );

      throw new HttpsError(
        'internal',
        'We could not load your recent inquiry activity. Please try again.',
      );
    }
  },
);

function createActivityResponse(
  documentUid: string,
  data:
    FirebaseFirestore.DocumentData,
  perspective:
    ListingInquiryActivityPerspective,
): ListingInquiryActivityResponse {
  return {
    inquiryUid:
      readString(
        data['inquiryUid'],
      ) ||
      documentUid,

    inquiryReferenceNumber:
      readString(
        data[
          'inquiryReferenceNumber'
        ],
      ),

    listingUid:
      readString(
        data['listingUid'],
      ),

    perspective,

    status:
      data['status'] === 'read'
        ? 'read'
        : 'new',

    buyerName:
      readString(
        data['buyerName'],
      ),

    propertyAddress:
      readString(
        data['propertyAddress'],
      ),

    createdAt:
      toIsoString(
        data['createdAt'],
      ),

    readAt:
      toNullableIsoString(
        data['readAt'],
      ),
  };
}

function toIsoString(
  value: unknown,
): string {
  if (value instanceof Timestamp) {
    return value
      .toDate()
      .toISOString();
  }

  return new Date(0).toISOString();
}

function toNullableIsoString(
  value: unknown,
): string | null {
  if (value instanceof Timestamp) {
    return value
      .toDate()
      .toISOString();
  }

  return null;
}

function readString(
  value: unknown,
): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}