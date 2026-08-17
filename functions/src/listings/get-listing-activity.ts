import * as logger from 'firebase-functions/logger';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  DocumentData,
  Timestamp
} from 'firebase-admin/firestore';

import {
  callableFunctionOptions
} from '../shared/function-options';

import {
  adminFirestore
} from '../shared/firebase-admin';

type ListingActivityType =
  | 'listing_published'
  | 'price_change'
  | 'inquiry_received'
  | 'showing_requested'
  | 'showing_confirmed'
  | 'showing_alternate_proposed'
  | 'showing_declined'
  | 'showing_cancelled'
  | 'showing_completed';

interface GetListingActivityData {
  listingUid: string;
}

interface ListingActivityItem {
  activityUid: string;
  activityType: ListingActivityType;
  title: string;
  description: string;
  occurredAt: string;
  referenceNumber: string | null;
  inquiryUid: string | null;
  showingRequestUid: string | null;
}

interface ListingActivitySummary {
  views: number;
  saves: number;
  inquiries: number;
  unreadInquiries: number;
  showingRequests: number;
  pendingShowingRequests: number;
}

interface GetListingActivityResponse {
  listingUid: string;
  activities: ListingActivityItem[];
  summary: ListingActivitySummary;
}

interface ShowingStatusHistoryDocument {
  status?: unknown;
  changedAt?: unknown;
}

const MAXIMUM_ACTIVITY_DOCUMENTS = 200;

export const getListingActivity = onCall<
  GetListingActivityData,
  Promise<GetListingActivityResponse>
>(
  {
    ...callableFunctionOptions
  },

  async request => {
    const currentUserUid =
      request.auth?.uid;

    if (!currentUserUid) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in before reviewing listing activity.'
      );
    }

    const listingUid =
      requireNonEmptyString(
        request.data?.listingUid,
        'A listing UID is required.'
      );

    const listingReference =
      adminFirestore
        .collection('listings')
        .doc(listingUid);

    const listingSnapshot =
      await listingReference.get();

    if (!listingSnapshot.exists) {
      throw new HttpsError(
        'not-found',
        'The selected listing could not be found.'
      );
    }

    const listingData =
      listingSnapshot.data() ?? {};

    const sellerUid =
      readString(
        listingData['sellerUid']
      );

    if (
      !sellerUid ||
      sellerUid !== currentUserUid
    ) {
      throw new HttpsError(
        'permission-denied',
        'Only the listing seller may review this activity.'
      );
    }

    try {
      const [
        inquirySnapshot,
        showingSnapshot,
        priceHistorySnapshot
      ] = await Promise.all([
        adminFirestore
          .collection('listingInquiries')
          .where(
            'listingUid',
            '==',
            listingUid
          )
          .limit(
            MAXIMUM_ACTIVITY_DOCUMENTS
          )
          .get(),

        adminFirestore
          .collection('showingRequests')
          .where(
            'listingUid',
            '==',
            listingUid
          )
          .limit(
            MAXIMUM_ACTIVITY_DOCUMENTS
          )
          .get(),

        listingReference
          .collection('priceHistory')
          .limit(
            MAXIMUM_ACTIVITY_DOCUMENTS
          )
          .get()
      ]);

      const activities:
        ListingActivityItem[] = [];

      const publishedAt =
        timestampToIsoString(
          listingData['publishedAt']
        );

      if (publishedAt) {
        activities.push({
          activityUid:
            `listing-published-${listingUid}`,

          activityType:
            'listing_published',

          title:
            'Listing published',

          description:
            'This property became available on NavStreet.',

          occurredAt:
            publishedAt,

          referenceNumber:
            null,

          inquiryUid:
            null,

          showingRequestUid:
            null
        });
      }

      inquirySnapshot.docs.forEach(
        inquiryDocument => {
          const inquiryData =
            inquiryDocument.data();

          const occurredAt =
            timestampToIsoString(
              inquiryData['createdAt']
            );

          if (!occurredAt) {
            return;
          }

          const buyerName =
            readString(
              inquiryData['buyerName']
            ) ?? 'A buyer';

          const referenceNumber =
            readString(
              inquiryData[
                'inquiryReferenceNumber'
              ]
            );

          activities.push({
            activityUid:
              `inquiry-${inquiryDocument.id}`,

            activityType:
              'inquiry_received',

            title:
              'Buyer inquiry received',

            description:
              `${buyerName} contacted you about this property.`,

            occurredAt,

            referenceNumber,

            inquiryUid:
              inquiryDocument.id,

            showingRequestUid:
              null
          });
        }
      );

      showingSnapshot.docs.forEach(
        showingDocument => {
          const showingData =
            showingDocument.data();

          const showingRequestUid =
            readString(
              showingData[
                'showingRequestUid'
              ]
            ) ?? showingDocument.id;

          const referenceNumber =
            readString(
              showingData[
                'showingReferenceNumber'
              ]
            );

          const buyerName =
            buildBuyerName(
              showingData
            );

          const history =
            readShowingHistory(
              showingData[
                'statusHistory'
              ]
            );

          if (history.length === 0) {
            const createdAt =
              timestampToIsoString(
                showingData['createdAt']
              );

            if (createdAt) {
              activities.push({
                activityUid:
                  `showing-requested-${showingRequestUid}`,

                activityType:
                  'showing_requested',

                title:
                  'Showing requested',

                description:
                  `${buyerName} requested a property showing.`,

                occurredAt:
                  createdAt,

                referenceNumber,

                inquiryUid:
                  null,

                showingRequestUid
              });
            }

            return;
          }

          history.forEach(
            (
              historyEntry,
              historyIndex
            ) => {
              const occurredAt =
                timestampToIsoString(
                  historyEntry.changedAt
                );

              const status =
                readString(
                  historyEntry.status
                );

              if (
                !occurredAt ||
                !status
              ) {
                return;
              }

              const activityDetails =
                showingActivityDetails(
                  status,
                  buyerName
                );

              if (!activityDetails) {
                return;
              }

              activities.push({
                activityUid:
                  `showing-${showingRequestUid}-${historyIndex}`,

                activityType:
                  activityDetails.activityType,

                title:
                  activityDetails.title,

                description:
                  activityDetails.description,

                occurredAt,

                referenceNumber,

                inquiryUid:
                  null,

                showingRequestUid
              });
            }
          );
        }
      );

      priceHistorySnapshot.docs.forEach(
        priceHistoryDocument => {
          const priceHistoryData =
            priceHistoryDocument.data();

          const occurredAt =
            timestampToIsoString(
              priceHistoryData['changedAt']
            );

          const previousPrice =
            readNumber(
              priceHistoryData[
                'previousPrice'
              ]
            );

          const newPrice =
            readNumber(
              priceHistoryData[
                'newPrice'
              ]
            );

          if (
            !occurredAt ||
            previousPrice === null ||
            newPrice === null
          ) {
            return;
          }

          const isReduction =
            newPrice < previousPrice;

          activities.push({
            activityUid:
              `price-${priceHistoryDocument.id}`,

            activityType:
              'price_change',

            title:
              isReduction
                ? 'Listing price reduced'
                : 'Listing price increased',

            description:
              `The listing price changed from ` +
              `${formatCurrency(previousPrice)} to ` +
              `${formatCurrency(newPrice)}.`,

            occurredAt,

            referenceNumber:
              null,

            inquiryUid:
              null,

            showingRequestUid:
              null
          });
        }
      );

      activities.sort(
        (
          firstActivity,
          secondActivity
        ) =>
          secondActivity.occurredAt
            .localeCompare(
              firstActivity.occurredAt
            )
      );

      const unreadInquiries =
        inquirySnapshot.docs.filter(
          document =>
            document.data()['isRead'] !==
            true
        ).length;

      const pendingShowingRequests =
        showingSnapshot.docs.filter(
          document =>
            document.data()['status'] ===
            'pending'
        ).length;

      const response:
        GetListingActivityResponse = {
        listingUid,

        activities,

        summary: {
          views:
            readNumber(
              listingData['views']
            ) ?? 0,

          saves:
            readNumber(
              listingData['favorites']
            ) ?? 0,

          inquiries:
            inquirySnapshot.size,

          unreadInquiries,

          showingRequests:
            showingSnapshot.size,

          pendingShowingRequests
        }
      };

      logger.info(
        'Listing activity loaded.',
        {
          listingUid,
          sellerUid:
            currentUserUid,
          activityCount:
            activities.length,
          inquiryCount:
            inquirySnapshot.size,
          showingRequestCount:
            showingSnapshot.size
        }
      );

      return response;
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        'Unable to load listing activity.',
        {
          listingUid,
          sellerUid:
            currentUserUid,
          error
        }
      );

      throw new HttpsError(
        'internal',
        'We could not load this listing activity. Please try again.'
      );
    }
  }
);

function requireNonEmptyString(
  value: unknown,
  errorMessage: string
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      errorMessage
    );
  }

  return value.trim();
}

function readString(
  value: unknown
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue =
    value.trim();

  return normalizedValue
    ? normalizedValue
    : null;
}

function readNumber(
  value: unknown
): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return null;
  }

  return value;
}

function timestampToIsoString(
  value: unknown
): string | null {
  if (value instanceof Timestamp) {
    return value
      .toDate()
      .toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (
      value as {
        toDate?: unknown;
      }
    ).toDate === 'function'
  ) {
    const convertedDate =
      (
        value as {
          toDate: () => Date;
        }
      ).toDate();

    if (
      convertedDate instanceof Date &&
      !Number.isNaN(
        convertedDate.getTime()
      )
    ) {
      return convertedDate.toISOString();
    }
  }

  return null;
}

function readShowingHistory(
  value: unknown
): ShowingStatusHistoryDocument[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (
      entry
    ): entry is ShowingStatusHistoryDocument =>
      Boolean(
        entry &&
        typeof entry === 'object'
      )
  );
}

function buildBuyerName(
  showingData: DocumentData
): string {
  const buyerContact =
    showingData['buyerContact'];

  if (
    !buyerContact ||
    typeof buyerContact !== 'object'
  ) {
    return 'A buyer';
  }

  const firstName =
    readString(
      buyerContact['firstName']
    );

  const lastName =
    readString(
      buyerContact['lastName']
    );

  const fullName = [
    firstName,
    lastName
  ]
    .filter(
      (
        name
      ): name is string =>
        Boolean(name)
    )
    .join(' ');

  return fullName || 'A buyer';
}

function showingActivityDetails(
  status: string,
  buyerName: string
): {
  activityType: ListingActivityType;
  title: string;
  description: string;
} | null {
  switch (status) {
    case 'pending':
      return {
        activityType:
          'showing_requested',

        title:
          'Showing requested',

        description:
          `${buyerName} requested a property showing.`
      };

    case 'confirmed':
      return {
        activityType:
          'showing_confirmed',

        title:
          'Showing confirmed',

        description:
          `The showing requested by ${buyerName} was confirmed.`
      };

    case 'alternate_proposed':
      return {
        activityType:
          'showing_alternate_proposed',

        title:
          'Alternate showing time proposed',

        description:
          `An alternate showing time was proposed to ${buyerName}.`
      };

    case 'declined':
      return {
        activityType:
          'showing_declined',

        title:
          'Showing declined',

        description:
          `The showing requested by ${buyerName} was declined.`
      };

    case 'cancelled':
      return {
        activityType:
          'showing_cancelled',

        title:
          'Showing cancelled',

        description:
          `The showing involving ${buyerName} was cancelled.`
      };

    case 'completed':
      return {
        activityType:
          'showing_completed',

        title:
          'Showing completed',

        description:
          `The showing involving ${buyerName} was completed.`
      };

    default:
      return null;
  }
}

function formatCurrency(
  amount: number
): string {
  return new Intl.NumberFormat(
    'en-US',
    {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }
  ).format(amount);
}