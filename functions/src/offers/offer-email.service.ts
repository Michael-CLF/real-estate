import sgMail from '@sendgrid/mail';

import {
  getAuth
} from 'firebase-admin/auth';

import {
  DocumentReference,
  FieldValue,
  Timestamp,
  getFirestore
} from 'firebase-admin/firestore';

import {
  getStorage
} from 'firebase-admin/storage';

import {
  logger
} from 'firebase-functions';

import {
  OTP_FROM_EMAIL,
  OTP_FROM_NAME,
  SENDGRID_API_KEY
} from '../authentication/otp/otp-config';

import type {
  OfferNotificationChannel,
  OfferNotificationType
} from './offer-notification.service';

const NAVSTREET_APP_URL =
  'https://navstreet.com';

const OFFER_NOTIFICATION_TEMPLATE_ID =
  'd-f73916caa1384c93a69adcb9cd32085f';

const PROCESSING_LEASE_MILLISECONDS =
  5 * 60 * 1000;

const MAXIMUM_EMAIL_ATTEMPTS = 5;

interface OfferNotificationEmailRecord {
  Uid?: string;
  recipientUid?: string;
  offerUid?: string;
  offerVersionUid?: string;
  listingUid?: string | null;
  type?: OfferNotificationType;
  title?: string;
  message?: string;
  propertyAddress?: string | null;
  channels?: OfferNotificationChannel[];
  metadata?: Record<
    string,
    string | number | boolean | null
  >;
  emailStatus?: string;
  emailAttemptCount?: number;
  emailProcessingStartedAt?: Timestamp | null;
}

interface AcceptedAgreementDocument {
  type?: string;
  offerUid?: string;
  offerVersionUid?: string;
  fileName?: string;
  contentType?: string;
  storagePath?: string;
}

interface EmailAttachment {
  content: string;
  filename: string;
  type: string;
  disposition: 'attachment';
}

export async function sendOfferNotificationEmail(
  notificationReference:
    DocumentReference,
  acceptedAgreement?:
    AcceptedAgreementDocument
): Promise<void> {
  const notification =
    await claimNotification(
      notificationReference
    );

  if (!notification) {
    return;
  }

  const notificationUid =
    notificationReference.id;

  try {
    const recipient =
      await resolveRecipient(
        requireString(
          notification.recipientUid,
          'recipientUid'
        )
      );

    const offerUid =
      requireString(
        notification.offerUid,
        'offerUid'
      );

    const title =
      requireString(
        notification.title,
        'title'
      );

    const message =
      requireString(
        notification.message,
        'message'
      );

    const attachment =
      acceptedAgreement
        ? await loadAgreementAttachment(
            acceptedAgreement
          )
        : undefined;

    if (
      notification.type ===
        'offer_fully_executed' &&
      !attachment
    ) {
      throw new Error(
        'The fully executed agreement is not ready for email delivery.'
      );
    }

    sgMail.setApiKey(
      SENDGRID_API_KEY.value()
    );

    const offerUrl =
      `${NAVSTREET_APP_URL}/offers/${encodeURIComponent(offerUid)}`;

    const dynamicTemplateData =
      createDynamicTemplateData(
        notification,
        recipient.name,
        title,
        message,
        offerUrl,
        Boolean(attachment)
      );

    await sgMail.send({
      to: {
        email: recipient.email,
        name: recipient.name
      },
      from: {
        email:
          OTP_FROM_EMAIL.value(),
        name:
          OTP_FROM_NAME.value()
      },
      templateId:
        OFFER_NOTIFICATION_TEMPLATE_ID,
      dynamicTemplateData,
      ...(attachment
        ? {
            attachments: [
              attachment
            ]
          }
        : {})
    });

    await notificationReference.update({
      emailStatus: 'sent',
      emailSentAt:
        Timestamp.now(),
      emailProcessingStartedAt:
        null,
      emailLastError:
        null,
      updatedAt:
        Timestamp.now()
    });
  } catch (error: unknown) {
    const errorMessage =
      getErrorMessage(error);

    logger.error(
      'Unable to send offer notification email.',
      {
        error,
        notificationUid,
        offerUid:
          notification.offerUid,
        offerVersionUid:
          notification.offerVersionUid,
        recipientUid:
          notification.recipientUid,
        notificationType:
          notification.type
      }
    );

    await notificationReference.update({
      emailStatus: 'failed',
      emailProcessingStartedAt:
        null,
      emailLastError:
        errorMessage.slice(0, 1000),
      updatedAt:
        Timestamp.now()
    });

    throw error;
  }
}

async function claimNotification(
  notificationReference:
    DocumentReference
): Promise<
  OfferNotificationEmailRecord |
  null
> {
  const firestore = getFirestore();

  return firestore.runTransaction(
    async transaction => {
      const notificationSnapshot =
        await transaction.get(
          notificationReference
        );

      if (!notificationSnapshot.exists) {
        return null;
      }

      const notification =
        notificationSnapshot.data() as
          OfferNotificationEmailRecord;

      if (
        !notification.channels?.includes(
          'email'
        ) ||
        notification.emailStatus ===
          'not_requested' ||
        notification.emailStatus ===
          'sent'
      ) {
        return null;
      }

      const attemptCount =
        typeof notification
          .emailAttemptCount === 'number'
          ? notification.emailAttemptCount
          : 0;

      if (
        attemptCount >=
          MAXIMUM_EMAIL_ATTEMPTS
      ) {
        transaction.update(
          notificationReference,
          {
            emailStatus: 'failed',
            emailProcessingStartedAt:
              null,
            emailLastError:
              'Maximum email delivery attempts reached.',
            updatedAt:
              FieldValue.serverTimestamp()
          }
        );

        return null;
      }

      if (
        notification.emailStatus ===
          'processing' &&
        notification
          .emailProcessingStartedAt &&
        Date.now() -
          notification
            .emailProcessingStartedAt
            .toMillis() <
          PROCESSING_LEASE_MILLISECONDS
      ) {
        throw new Error(
          'This notification email is already being processed.'
        );
      }

      transaction.update(
        notificationReference,
        {
          emailStatus: 'processing',
          emailAttemptCount:
            FieldValue.increment(1),
          emailProcessingStartedAt:
            Timestamp.now(),
          emailLastError: null,
          updatedAt:
            FieldValue.serverTimestamp()
        }
      );

      return notification;
    }
  );
}

async function resolveRecipient(
  recipientUid: string
): Promise<{
  email: string;
  name: string;
}> {
  const userSnapshot =
    await getFirestore()
      .collection('users')
      .doc(recipientUid)
      .get();

  const user =
    userSnapshot.data();

  const firestoreEmail =
    readOptionalString(
      user?.['email']
    );

  const firestoreName =
    readOptionalString(
      user?.['displayName']
    ) ||
    [
      readOptionalString(
        user?.['firstName']
      ),
      readOptionalString(
        user?.['lastName']
      )
    ]
      .filter(Boolean)
      .join(' ');

  if (firestoreEmail) {
    return {
      email: firestoreEmail,
      name:
        firestoreName ||
        'NavStreet user'
    };
  }

  const authenticationUser =
    await getAuth()
      .getUser(recipientUid);

  if (!authenticationUser.email) {
    throw new Error(
      'The notification recipient does not have an email address.'
    );
  }

  return {
    email:
      authenticationUser.email,
    name:
      firestoreName ||
      authenticationUser.displayName ||
      'NavStreet user'
  };
}

async function loadAgreementAttachment(
  agreement:
    AcceptedAgreementDocument
): Promise<EmailAttachment> {
  const storagePath =
    requireString(
      agreement.storagePath,
      'storagePath'
    );

  const [
    agreementBuffer
  ] = await getStorage()
    .bucket()
    .file(storagePath)
    .download();

  return {
    content:
      agreementBuffer.toString(
        'base64'
      ),
    filename:
      requireString(
        agreement.fileName,
        'fileName'
      ),
    type:
      readOptionalString(
        agreement.contentType
      ) ||
      'application/pdf',
    disposition:
      'attachment'
  };
}

function createDynamicTemplateData(
  notification:
    OfferNotificationEmailRecord,
  recipientName: string,
  title: string,
  message: string,
  offerUrl: string,
  includesAgreement: boolean
): Record<string, unknown> {
  const versionNumber =
    readOptionalNumber(
      notification.metadata?.[
        'versionNumber'
      ]
    );

  const referenceNumber =
    readOptionalString(
      notification.metadata?.[
        'referenceNumber'
      ]
    );

  const offerNumber =
    referenceNumber
      ? versionNumber
        ? `${referenceNumber}-${versionNumber}`
        : referenceNumber
      : 'Available in NavStreet';

  const actorName =
    readOptionalString(
      notification.metadata?.[
        'fromPartyName'
      ]
    ) ||
    (
      notification.type ===
        'offer_fully_executed'
        ? 'Buyer and seller'
        : 'NavStreet participant'
    );

  const presentation =
    getTemplatePresentation(
      notification.type,
      versionNumber,
      title
    );

  return {
    subject:
      presentation.subject,
    previewText: message,
    eyebrow:
      presentation.eyebrow,
    headline:
      presentation.headline,
    recipientName,
    message,
    propertyAddress:
      notification.propertyAddress ||
      '',
    offerNumber,
    statusLabel:
      presentation.statusLabel,
    actorName,
    hasAgreementAttachment:
      includesAgreement,
    offerUrl,
    buttonText:
      presentation.buttonText,
    currentYear:
      new Date().getFullYear()
  };
}

function getTemplatePresentation(
  type:
    OfferNotificationType |
    undefined,
  versionNumber:
    number | null,
  fallbackTitle: string
): {
  subject: string;
  eyebrow: string;
  headline: string;
  statusLabel: string;
  buttonText: string;
} {
  const isCounteroffer =
    Boolean(
      versionNumber &&
      versionNumber > 1
    );

  switch (type) {
    case 'signature_requested':
    case 'offer_submitted':
    case 'offer_countered':
      return isCounteroffer ||
        type === 'offer_countered'
        ? {
            subject: fallbackTitle
              .replace(
                /^Offer /,
                'Counteroffer '
              ),
            eyebrow:
              'Counteroffer received',
            headline:
              'You received a counteroffer',
            statusLabel:
              'Response required',
            buttonText:
              'Review Counteroffer'
          }
        : {
            subject: fallbackTitle,
            eyebrow:
              'New offer received',
            headline:
              'A buyer submitted an offer',
            statusLabel:
              'Response required',
            buttonText:
              'Review Offer'
          };

    case 'offer_accepted':
      return {
        subject: fallbackTitle,
        eyebrow: 'Offer accepted',
        headline:
          'Your offer was accepted',
        statusLabel: 'Accepted',
        buttonText: 'View Offer'
      };

    case 'offer_rejected':
      return {
        subject: fallbackTitle,
        eyebrow: 'Offer declined',
        headline:
          'The current offer was declined',
        statusLabel: 'Declined',
        buttonText:
          'View Offer History'
      };

    case 'offer_withdrawn':
      return {
        subject: fallbackTitle,
        eyebrow: 'Offer withdrawn',
        headline:
          'An offer was withdrawn',
        statusLabel: 'Withdrawn',
        buttonText:
          'View Offer History'
      };

    case 'offer_fully_executed':
      return {
        subject: fallbackTitle,
        eyebrow: 'Contract effective',
        headline:
          'Your agreement is fully executed',
        statusLabel:
          'Accepted — contract effective',
        buttonText: 'View Contract'
      };

    case 'offer_closed_due_to_contract':
      return {
        subject: fallbackTitle,
        eyebrow: 'Offer closed',
        headline:
          'Your offer was not accepted',
        statusLabel:
          'Another offer was accepted',
        buttonText:
          'View Offer History'
      };

    case 'offer_expired':
      return {
        subject: fallbackTitle,
        eyebrow: 'Offer expired',
        headline:
          'The offer has expired',
        statusLabel: 'Expired',
        buttonText:
          'View Offer History'
      };

    case 'property_marked_sold':
      return {
        subject: fallbackTitle,
        eyebrow: 'Property sold',
        headline:
          'The property has been marked sold',
        statusLabel: 'Sold',
        buttonText:
          'View Transaction'
      };

    case 'buyer_signed':
    case 'seller_signed':
      return {
        subject: fallbackTitle,
        eyebrow: 'Signature completed',
        headline:
          'A required party signed',
        statusLabel:
          'Signature completed',
        buttonText: 'View Offer'
      };

    default:
      return {
        subject: fallbackTitle,
        eyebrow: 'Offer activity',
        headline:
          'There is an update to your offer',
        statusLabel: 'Updated',
        buttonText: 'View Offer'
      };
  }
}

function readOptionalString(
  value: unknown
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized =
    value.trim();

  return normalized || null;
}

function readOptionalNumber(
  value: unknown
): number | null {
  return typeof value === 'number' &&
    Number.isFinite(value)
      ? value
      : null;
}

function requireString(
  value: unknown,
  fieldName: string
): string {
  const normalized =
    readOptionalString(value);

  if (!normalized) {
    throw new Error(
      `${fieldName} is required to send an offer notification email.`
    );
  }

  return normalized;
}

function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error &&
    error.message
      ? error.message
      : 'Unknown email delivery error.';
}
