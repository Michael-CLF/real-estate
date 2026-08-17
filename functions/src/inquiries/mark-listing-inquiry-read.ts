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

interface MarkListingInquiryReadData {
  inquiryUid: string;
}

interface MarkListingInquiryReadResponse {
  inquiryUid: string;
  status: 'read';
  isRead: true;
  readAt: string;
}

/**
 * Marks an inquiry as read after confirming the
 * authenticated user is the listing seller.
 */
export const markListingInquiryRead = onCall<
  MarkListingInquiryReadData,
  Promise<MarkListingInquiryReadResponse>
>(
  {
    ...callableFunctionOptions,
  },

  async request => {
    const authenticatedSellerUid =
      request.auth?.uid;

    if (!authenticatedSellerUid) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in before updating buyer inquiries.',
      );
    }

    const inquiryUid =
      validateInquiryUid(
        request.data,
      );

    const inquiryReference =
      adminFirestore
        .collection(
          'listingInquiries',
        )
        .doc(inquiryUid);

    const readAt =
      Timestamp.now();

    try {
      await adminFirestore.runTransaction(
        async transaction => {
          const inquirySnapshot =
            await transaction.get(
              inquiryReference,
            );

          if (!inquirySnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The selected inquiry could not be found.',
            );
          }

          const inquiryData =
            inquirySnapshot.data();

          const sellerUid =
            readString(
              inquiryData?.[
                'sellerUid'
              ],
            );

          if (
            !sellerUid ||
            sellerUid !==
            authenticatedSellerUid
          ) {
            throw new HttpsError(
              'permission-denied',
              'You do not have permission to update this inquiry.',
            );
          }

          if (
            inquiryData?.['isRead'] ===
            true
          ) {
            return;
          }

          transaction.update(
            inquiryReference,
            {
              status: 'read',
              isRead: true,
              readAt,
              updatedAt: readAt,
            },
          );
        },
      );
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        'Unable to mark listing inquiry as read.',
        {
          error,
          inquiryUid,
          authenticatedSellerUid,
        },
      );

      throw new HttpsError(
        'internal',
        'We could not update this inquiry. Please try again.',
      );
    }

    logger.info(
      'Listing inquiry marked as read.',
      {
        inquiryUid,
        sellerUid:
          authenticatedSellerUid,
      },
    );

    return {
      inquiryUid,
      status: 'read',
      isRead: true,
      readAt:
        readAt
          .toDate()
          .toISOString(),
    };
  },
);

function validateInquiryUid(
  value: unknown,
): string {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'An inquiry UID is required.',
    );
  }

  const inquiryUid =
    readString(
      value['inquiryUid'],
    );

  if (
    !inquiryUid ||
    inquiryUid.length > 128
  ) {
    throw new HttpsError(
      'invalid-argument',
      'A valid inquiry UID is required.',
    );
  }

  return inquiryUid;
}

function readString(
  value: unknown,
): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}