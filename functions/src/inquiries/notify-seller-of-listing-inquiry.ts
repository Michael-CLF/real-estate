import * as logger from 'firebase-functions/logger';

import {
  onDocumentCreated,
} from 'firebase-functions/v2/firestore';

import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  SENDGRID_API_KEY,
} from '../authentication/otp/otp-config';

import {
  adminAuth,
  adminFirestore,
} from '../shared/firebase-admin';

import {
  FUNCTION_REGION,
} from '../shared/function-options';

import {
  NAVSTREET_APP_URL,
} from '../showings/showing-notification-config';

import {
  sendSellerListingInquiryEmail,
} from './inquiry-email.service';

/**
 * Sends the seller an email whenever a new listing
 * inquiry document is created.
 */
export const notifySellerOfListingInquiry =
  onDocumentCreated(
    {
      document:
        'listingInquiries/{inquiryUid}',

      region:
        FUNCTION_REGION,

      secrets: [
        SENDGRID_API_KEY,
      ],

      maxInstances: 10,
    },

    async event => {
      const snapshot =
        event.data;

      if (!snapshot) {
        logger.error(
          'Listing inquiry trigger contains no snapshot.',
        );

        return;
      }

      const inquiryUid =
        event.params['inquiryUid'];

      const data =
        snapshot.data();

      const sellerUid =
        readString(
          data['sellerUid'],
        );

      const listingUid =
        readString(
          data['listingUid'],
        );

      const buyerName =
        readString(
          data['buyerName'],
        );

      const buyerEmail =
        readString(
          data['buyerEmail'],
        );

      const buyerPhone =
        readString(
          data['buyerPhone'],
        );

      const buyerMessage =
        readString(
          data['message'],
        );

      const propertyAddress =
        readString(
          data['propertyAddress'],
        );

      const inquiryReferenceNumber =
        readString(
          data[
            'inquiryReferenceNumber'
          ],
        ) ||
        createInquiryReferenceNumber(
          inquiryUid,
          data['createdAt'],
        );

      if (
        !sellerUid ||
        !listingUid ||
        !buyerName ||
        !buyerEmail ||
        !buyerPhone ||
        !buyerMessage ||
        !propertyAddress
      ) {
        logger.error(
          'Listing inquiry is missing notification data.',
          {
            inquiryUid,
            listingUid,
            sellerUid,
          },
        );

        await markNotificationFailed(
          snapshot.ref,
          'Listing inquiry data is incomplete.',
        );

        return;
      }

      try {
        const sellerRecord =
          await adminAuth.getUser(
            sellerUid,
          );

        const sellerEmail =
          sellerRecord.email
            ?.trim()
            .toLowerCase() ?? '';

        if (!sellerEmail) {
          throw new Error(
            'The seller account does not have an email address.',
          );
        }

        const sellerProfileSnapshot =
          await adminFirestore
            .collection('users')
            .doc(sellerUid)
            .get();

        const sellerProfile =
          sellerProfileSnapshot.data();

        const sellerName =
          getSellerName(
            sellerProfile,
            sellerRecord.displayName,
          );

        const dashboardUrl =
          createDashboardUrl(
            listingUid,
          );

        await sendSellerListingInquiryEmail({
          sellerEmail,
          sellerName,

          buyerName,
          buyerEmail,
          buyerPhone,

          propertyAddress,
          buyerMessage,

          inquiryReferenceNumber,
          dashboardUrl,
        });

        await snapshot.ref.update({
          inquiryReferenceNumber,

          sellerNotification: {
            channel: 'email',
            status: 'sent',

            recipientEmail:
              sellerEmail,

            sentAt:
              FieldValue
                .serverTimestamp(),

            failedAt: null,
            failureMessage: '',
          },

          updatedAt:
            FieldValue
              .serverTimestamp(),
        });

        logger.info(
          'Seller listing-inquiry email sent.',
          {
            inquiryUid,
            inquiryReferenceNumber,
            listingUid,
            sellerUid,
          },
        );
      } catch (error: unknown) {
        logger.error(
          'Unable to send seller listing-inquiry email.',
          {
            error,
            inquiryUid,
            inquiryReferenceNumber,
            listingUid,
            sellerUid,
          },
        );

        await snapshot.ref.update({
          inquiryReferenceNumber,

          sellerNotification: {
            channel: 'email',
            status: 'failed',
            recipientEmail: '',
            sentAt: null,

            failedAt:
              FieldValue
                .serverTimestamp(),

            failureMessage:
              getFailureMessage(
                error,
              ),
          },

          updatedAt:
            FieldValue
              .serverTimestamp(),
        });
      }
    },
  );

function createDashboardUrl(
  listingUid: string,
): string {
  const applicationUrl =
    NAVSTREET_APP_URL
      .value()
      .replace(/\/+$/, '');

  return (
    `${applicationUrl}` +
    '/sell/listings/' +
    encodeURIComponent(
      listingUid,
    ) +
    '/manage/inquiries'
  );
}

function createInquiryReferenceNumber(
  inquiryUid: string,
  createdAt: unknown,
): string {
  const date =
    createdAt instanceof Timestamp
      ? createdAt.toDate()
      : new Date();

  const datePortion = [
    date.getUTCFullYear(),

    (date.getUTCMonth() + 1)
      .toString()
      .padStart(2, '0'),

    date.getUTCDate()
      .toString()
      .padStart(2, '0'),
  ].join('');

  const uniquePortion =
    inquiryUid
      .replace(
        /[^a-zA-Z0-9]/g,
        '',
      )
      .slice(0, 6)
      .toUpperCase()
      .padEnd(6, 'X');

  return (
    `INQ-${datePortion}-` +
    uniquePortion
  );
}

function getSellerName(
  profile:
    Record<string, unknown> |
    undefined,
  authenticationDisplayName:
    string | undefined,
): string {
  if (profile) {
    const firstName =
      readString(
        profile['firstName'],
      );

    const lastName =
      readString(
        profile['lastName'],
      );

    const fullName =
      [
        firstName,
        lastName,
      ]
        .filter(Boolean)
        .join(' ');

    if (fullName) {
      return fullName;
    }

    const displayName =
      readString(
        profile['displayName'],
      );

    if (displayName) {
      return displayName;
    }
  }

  return (
    authenticationDisplayName
      ?.trim() ||
    'NavStreet seller'
  );
}

async function markNotificationFailed(
  reference:
    FirebaseFirestore.DocumentReference,
  failureMessage: string,
): Promise<void> {
  await reference.update({
    sellerNotification: {
      channel: 'email',
      status: 'failed',
      recipientEmail: '',
      sentAt: null,

      failedAt:
        FieldValue
          .serverTimestamp(),

      failureMessage,
    },

    updatedAt:
      FieldValue
        .serverTimestamp(),
  });
}

function getFailureMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message.slice(
      0,
      500,
    );
  }

  return (
    'Unknown email delivery failure.'
  );
}

function readString(
  value: unknown,
): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}