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
} from './showing-notification-config';

import {
  sendSellerShowingRequestEmail,
} from './showing-email.service';

/**
 * Sends the seller an email whenever a new showing
 * request document is created.
 */
export const notifySellerOfShowingRequest =
  onDocumentCreated(
    {
      document:
        'showingRequests/{showingRequestUid}',

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
          'Showing request trigger contains no snapshot.',
        );

        return;
      }

      const showingRequestUid =
        event.params[
          'showingRequestUid'
        ];

      const data =
        snapshot.data();

      const sellerUid =
        readString(
          data['sellerUid'],
        );

      const buyerContact =
        isRecord(
          data['buyerContact'],
        )
          ? data['buyerContact']
          : null;

      const requestedTime =
        isRecord(
          data['requestedTime'],
        )
          ? data['requestedTime']
          : null;

      if (
        !sellerUid ||
        !buyerContact ||
        !requestedTime
      ) {
        logger.error(
          'Showing request is missing notification data.',
          {
            showingRequestUid,
          },
        );

        await markNotificationFailed(
          snapshot.ref,
          'Showing request data is incomplete.',
        );

        return;
      }

      const showingReferenceNumber =
        readString(
          data[
            'showingReferenceNumber'
          ],
        ) ||
        createShowingReferenceNumber(
          showingRequestUid,
          data['createdAt'],
        );

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

        const requestedDate =
          readString(
            requestedTime['date'],
          );

        const requestedStartTime =
          readString(
            requestedTime[
              'startTime'
            ],
          );

        const requestedEndTime =
          readString(
            requestedTime[
              'endTime'
            ],
          );

        const requestedTimeZone =
          readString(
            requestedTime[
              'timeZone'
            ],
          );

        if (
          !requestedDate ||
          !requestedStartTime ||
          !requestedEndTime ||
          !requestedTimeZone
        ) {
          throw new Error(
            'The requested showing time is incomplete.',
          );
        }

        const buyerFirstName =
          readString(
            buyerContact[
              'firstName'
            ],
          );

        const buyerLastName =
          readString(
            buyerContact[
              'lastName'
            ],
          );

        const buyerName =
          [
            buyerFirstName,
            buyerLastName,
          ]
            .filter(Boolean)
            .join(' ');

        const propertyAddress =
          createPropertyAddress(
            data,
          );

        const dashboardUrl =
          createDashboardUrl(
            showingRequestUid,
          );

        await sendSellerShowingRequestEmail({
          sellerEmail,
          sellerName,

          buyerName:
            buyerName || 'A buyer',

          buyerEmail:
            readString(
              buyerContact['email'],
            ),

          buyerPhone:
            readString(
              buyerContact['phone'],
            ),

          propertyAddress,

          requestedDate:
            formatDate(
              requestedDate,
              requestedTimeZone,
            ),

          requestedStartTime:
            formatTime(
              requestedStartTime,
            ),

          requestedEndTime:
            formatTime(
              requestedEndTime,
            ),

          requestedTimeZone,

          buyerMessage:
            readString(
              data['buyerMessage'],
            ),

          showingReferenceNumber,
          dashboardUrl,
        });

        await snapshot.ref.update({
          showingReferenceNumber,

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
          'Seller showing-request email sent.',
          {
            showingRequestUid,
            showingReferenceNumber,
            sellerUid,
          },
        );
      } catch (error: unknown) {
        logger.error(
          'Unable to send seller showing-request email.',
          {
            error,
            showingRequestUid,
            showingReferenceNumber,
            sellerUid,
          },
        );

        await snapshot.ref.update({
          showingReferenceNumber,

          sellerNotification: {
            channel: 'email',
            status: 'failed',
            recipientEmail: '',

            sentAt: null,

            failedAt:
              FieldValue
                .serverTimestamp(),

            failureMessage:
              getFailureMessage(error),
          },

          updatedAt:
            FieldValue
              .serverTimestamp(),
        });
      }
    },
  );

function createShowingReferenceNumber(
  showingRequestUid: string,
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
    showingRequestUid
      .replace(
        /[^a-zA-Z0-9]/g,
        '',
      )
      .slice(0, 6)
      .toUpperCase()
      .padEnd(6, 'X');

  return (
    `SHW-${datePortion}-` +
    uniquePortion
  );
}

function createDashboardUrl(
  showingRequestUid: string,
): string {
  const applicationUrl =
    NAVSTREET_APP_URL
      .value()
      .replace(/\/+$/, '');

  return (
    `${applicationUrl}` +
    '/dashboard/showings/requests/' +
    encodeURIComponent(
      showingRequestUid,
    )
  );
}

function createPropertyAddress(
  data: Record<string, unknown>,
): string {
  const addressLine =
    readString(
      data['propertyAddress'],
    );

  const city =
    readString(
      data['propertyCity'],
    );

  const state =
    readString(
      data['propertyState'],
    );

  const zipCode =
    readString(
      data['propertyZipCode'],
    );

  const cityStateZip = [
    city,
    state,
    zipCode,
  ]
    .filter(Boolean)
    .join(' ');

  return [
    addressLine,
    cityStateZip,
  ]
    .filter(Boolean)
    .join(', ');
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

function formatDate(
  date: string,
  timeZone: string,
): string {
  const [year, month, day] =
    date.split('-').map(Number);

  const calendarDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        12,
      ),
    );

  try {
    return new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone,
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      },
    ).format(calendarDate);
  } catch {
    return date;
  }
}

function formatTime(
  time: string,
): string {
  const [hoursValue, minutesValue] =
    time.split(':').map(Number);

  if (
    !Number.isFinite(hoursValue) ||
    !Number.isFinite(minutesValue)
  ) {
    return time;
  }

  const period =
    hoursValue >= 12
      ? 'PM'
      : 'AM';

  const hours =
    hoursValue % 12 || 12;

  return (
    `${hours}:` +
    minutesValue
      .toString()
      .padStart(2, '0') +
    ` ${period}`
  );
}

async function markNotificationFailed(
  reference: FirebaseFirestore.DocumentReference,
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

  return 'Unknown email delivery failure.';
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