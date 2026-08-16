import * as logger from 'firebase-functions/logger';

import {
  onDocumentUpdated,
} from 'firebase-functions/v2/firestore';

import {
  FieldValue,
} from 'firebase-admin/firestore';

import {
  SENDGRID_API_KEY,
} from '../authentication/otp/otp-config';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import {
  FUNCTION_REGION,
} from '../shared/function-options';

import {
  NAVSTREET_APP_URL,
} from './showing-notification-config';

import {
  BuyerShowingStatusEmailKind,
  sendBuyerShowingStatusEmail,
} from './showing-email.service';

const NOTIFIABLE_STATUSES =
  new Set<BuyerShowingStatusEmailKind>([
    'confirmed',
    'declined',
    'alternate_proposed',
    'cancelled',
  ]);

/**
 * Sends the buyer an email when the seller changes the
 * status of a showing request.
 */
export const notifyBuyerOfShowingResponse =
  onDocumentUpdated(
    {
      document:
        'showingRequests/{showingRequestUid}',

      region:
        FUNCTION_REGION,

      secrets: [
        SENDGRID_API_KEY,
      ],
    },

    async event => {
      const beforeSnapshot =
        event.data?.before;

      const afterSnapshot =
        event.data?.after;

      if (
        !beforeSnapshot ||
        !afterSnapshot
      ) {
        return;
      }

      const beforeData =
        beforeSnapshot.data();

      const afterData =
        afterSnapshot.data();

      const previousStatus =
        readString(
          beforeData['status'],
        );

      const currentStatus =
        readString(
          afterData['status'],
        );

      if (
        !currentStatus ||
        previousStatus === currentStatus ||
        !isNotifiableStatus(currentStatus)
      ) {
        return;
      }

      const showingRequestUid =
        event.params['showingRequestUid'];

      const requestReference =
        adminFirestore
          .collection('showingRequests')
          .doc(showingRequestUid);

      /*
       * Re-read the current document so a retried event
       * does not resend a notification that was already
       * recorded successfully.
       */
      const currentSnapshot =
        await requestReference.get();

      if (!currentSnapshot.exists) {
        return;
      }

      const currentData =
        currentSnapshot.data() ?? {};

      if (
        readString(
          currentData['status'],
        ) !== currentStatus
      ) {
        /*
         * A newer status change has already occurred.
         * Do not send an outdated notification.
         */
        return;
      }

      const existingNotification =
        readRecord(
          currentData[
            'buyerStatusNotification'
          ],
        );

      if (
        readString(
          existingNotification['status'],
        ) === currentStatus
      ) {
        logger.info(
          'Buyer showing-status email already sent.',
          {
            showingRequestUid,
            status:
              currentStatus,
          },
        );

        return;
      }

      const buyerContact =
        readRecord(
          currentData['buyerContact'],
        );

      const buyerEmail =
        readString(
          buyerContact['email'],
        );

      if (!buyerEmail) {
        logger.warn(
          'Showing request has no buyer email address.',
          {
            showingRequestUid,
          },
        );

        return;
      }

      const buyerName =
        createPersonName(
          readString(
            buyerContact['firstName'],
          ),
          readString(
            buyerContact['lastName'],
          ),
        ) || 'there';

      const propertyAddress =
        createPropertyAddress(
          currentData,
        );

      const appointment =
        getNotificationAppointment(
          currentData,
          currentStatus,
        );

      const sellerMessage =
        readString(
          currentData[
            'sellerResponseMessage'
          ],
        );

      const showingReferenceNumber =
        readString(
          currentData[
            'showingReferenceNumber'
          ],
        ) || showingRequestUid;

      const listingUid =
        readString(
          currentData['listingUid'],
        );

      const actionUrl =
        createBuyerDashboardUrl();

      try {
        await sendBuyerShowingStatusEmail({
          buyerEmail,
          buyerName,
          status:
            currentStatus,
          propertyAddress,

          appointmentDate:
            formatDate(
              appointment.date,
            ),

          appointmentStartTime:
            formatTime(
              appointment.startTime,
            ),

          appointmentEndTime:
            formatTime(
              appointment.endTime,
            ),

          appointmentTimeZone:
            appointment.timeZone,

          sellerMessage,
          showingReferenceNumber,
          actionUrl,
        });

        await requestReference.update({
          buyerStatusNotification: {
            status:
              currentStatus,

            sentAt:
              FieldValue.serverTimestamp(),

            eventId:
              event.id,

            recipientEmail:
              buyerEmail,
          },

          updatedAt:
            FieldValue.serverTimestamp(),
        });

        logger.info(
          'Buyer showing-status email sent.',
          {
            showingRequestUid,
            listingUid,
            status:
              currentStatus,
          },
        );
      } catch (error: unknown) {
        logger.error(
          'Unable to send buyer showing-status email.',
          {
            showingRequestUid,
            listingUid,
            status:
              currentStatus,
            error,
          },
        );

        throw error;
      }
    },
  );

interface NotificationAppointment {
  date: string;
  startTime: string;
  endTime: string;
  timeZone: string;
}

function getNotificationAppointment(
  data: Record<string, unknown>,
  status: BuyerShowingStatusEmailKind,
): NotificationAppointment {
  if (
    status === 'alternate_proposed'
  ) {
    const alternateTime =
      readRecord(
        data['alternateTime'],
      );

    if (
      readString(
        alternateTime['date'],
      )
    ) {
      return readAppointment(
        alternateTime,
      );
    }
  }

  /*
   * A confirmed alternate appointment remains stored
   * in alternateTime. Use it when one exists.
   */
  if (
    status === 'confirmed'
  ) {
    const alternateTime =
      readRecord(
        data['alternateTime'],
      );

    if (
      readString(
        alternateTime['date'],
      )
    ) {
      return readAppointment(
        alternateTime,
      );
    }
  }

  return readAppointment(
    readRecord(
      data['requestedTime'],
    ),
  );
}

function readAppointment(
  data: Record<string, unknown>,
): NotificationAppointment {
  return {
    date:
      readString(
        data['date'],
      ),

    startTime:
      readString(
        data['startTime'],
      ),

    endTime:
      readString(
        data['endTime'],
      ),

    timeZone:
      readString(
        data['timeZone'],
      ),
  };
}

function createBuyerDashboardUrl(): string {
  const applicationUrl =
    NAVSTREET_APP_URL
      .value()
      .replace(/\/+$/, '');

  return (
    `${applicationUrl}` +
    '/dashboard/showings'
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

  const cityAndState = [
    city,
    state,
  ]
    .filter(Boolean)
    .join(', ');

  return [
    addressLine,
    cityAndState,
    zipCode,
  ]
    .filter(Boolean)
    .join(' ');
}

function createPersonName(
  firstName: string,
  lastName: string,
): string {
  return [
    firstName,
    lastName,
  ]
    .filter(Boolean)
    .join(' ');
}

function formatDate(
  date: string,
): string {
  const parsedDate =
    new Date(`${date}T12:00:00`);

  if (
    !date ||
    Number.isNaN(
      parsedDate.getTime(),
    )
  ) {
    return date;
  }

  return new Intl.DateTimeFormat(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
  ).format(parsedDate);
}

function formatTime(
  time: string,
): string {
  const [
    hourValue,
    minuteValue,
  ] = time
    .split(':')
    .map(Number);

  if (
    !Number.isFinite(hourValue) ||
    !Number.isFinite(minuteValue)
  ) {
    return time;
  }

  const date =
    new Date();

  date.setHours(
    hourValue,
    minuteValue,
    0,
    0,
  );

  return new Intl.DateTimeFormat(
    'en-US',
    {
      hour: 'numeric',
      minute: '2-digit',
    },
  ).format(date);
}

function isNotifiableStatus(
  status: string,
): status is BuyerShowingStatusEmailKind {
  return NOTIFIABLE_STATUSES.has(
    status as BuyerShowingStatusEmailKind,
  );
}

function readRecord(
  value: unknown,
): Record<string, unknown> {
  return isRecord(value)
    ? value
    : {};
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