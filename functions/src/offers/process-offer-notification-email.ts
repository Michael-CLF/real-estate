import {
  getFirestore
} from 'firebase-admin/firestore';

import {
  logger
} from 'firebase-functions';

import {
  onDocumentCreated
} from 'firebase-functions/v2/firestore';

import {
  SENDGRID_API_KEY
} from '../authentication/otp/otp-config';

import {
  sendOfferNotificationEmail
} from './offer-email.service';

import {
  createOfferNotificationUid
} from './offer-notification.service';

import type {
  OfferNotificationType
} from './offer-notification.service';

interface OfferNotificationRecord {
  offerUid?: string;
  offerVersionUid?: string;
  type?: OfferNotificationType;
  channels?: string[];
}

interface AcceptedAgreementDocument {
  type?: string;
  offerUid?: string;
  offerVersionUid?: string;
  fileName?: string;
  contentType?: string;
  storagePath?: string;
}

interface OfferRecord {
  buyerUids?: string[];
  sellerUids?: string[];
}

export const processOfferNotificationEmail =
  onDocumentCreated(
    {
      document:
        'notifications/{notificationUid}',
      region:
        'us-central1',
      secrets: [
        SENDGRID_API_KEY
      ],
      retry: true
    },
    async event => {
      const notificationSnapshot =
        event.data;

      if (!notificationSnapshot) {
        return;
      }

      const notification =
        notificationSnapshot.data() as
          OfferNotificationRecord;

      if (
        !notification.channels?.includes(
          'email'
        )
      ) {
        return;
      }

      if (
        notification.type !==
          'offer_fully_executed'
      ) {
        await sendOfferNotificationEmail(
          notificationSnapshot.ref
        );

        return;
      }

      const offerUid =
        requireString(
          notification.offerUid,
          'offerUid'
        );

      const offerVersionUid =
        requireString(
          notification.offerVersionUid,
          'offerVersionUid'
        );

      const agreementSnapshot =
        await getFirestore()
          .collection('offers')
          .doc(offerUid)
          .collection('documents')
          .doc(
            `${offerVersionUid}-accepted_agreement`
          )
          .get();

      if (!agreementSnapshot.exists) {
        logger.info(
          'Final agreement email is waiting for the signed PDF.',
          {
            notificationUid:
              notificationSnapshot.id,
            offerUid,
            offerVersionUid
          }
        );

        return;
      }

      await sendOfferNotificationEmail(
        notificationSnapshot.ref,
        agreementSnapshot.data() as
          AcceptedAgreementDocument
      );
    }
  );

export const processFinalAgreementEmail =
  onDocumentCreated(
    {
      document:
        'offers/{offerUid}/documents/{documentUid}',
      region:
        'us-central1',
      secrets: [
        SENDGRID_API_KEY
      ],
      retry: true
    },
    async event => {
      const agreementSnapshot =
        event.data;

      if (!agreementSnapshot) {
        return;
      }

      const agreement =
        agreementSnapshot.data() as
          AcceptedAgreementDocument;

      if (
        agreement.type !==
          'accepted_agreement'
      ) {
        return;
      }

      const offerUid =
        requireString(
          agreement.offerUid ||
            event.params['offerUid'],
          'offerUid'
        );

      const offerVersionUid =
        requireString(
          agreement.offerVersionUid,
          'offerVersionUid'
        );

      const firestore =
        getFirestore();

      const offerSnapshot =
        await firestore
          .collection('offers')
          .doc(offerUid)
          .get();

      if (!offerSnapshot.exists) {
        throw new Error(
          'The accepted agreement does not have a matching offer.'
        );
      }

      const offer =
        offerSnapshot.data() as
          OfferRecord;

      const recipientUids =
        uniqueStrings([
          ...(offer.buyerUids ?? []),
          ...(offer.sellerUids ?? [])
        ]);

      for (
        const recipientUid of
          recipientUids
      ) {
        const notificationUid =
          createOfferNotificationUid(
            firestore,
            {
              recipientUid,
              offerUid,
              offerVersionUid,
              type:
                'offer_fully_executed',
              eventKey:
                'fully-executed'
            }
          );

        const notificationReference =
          firestore
            .collection('notifications')
            .doc(notificationUid);

        const notificationSnapshot =
          await notificationReference.get();

        if (!notificationSnapshot.exists) {
          logger.warn(
            'The final agreement notification could not be found.',
            {
              notificationUid,
              offerUid,
              offerVersionUid,
              recipientUid
            }
          );

          continue;
        }

        await sendOfferNotificationEmail(
          notificationReference,
          agreement
        );
      }
    }
  );

function uniqueStrings(
  values: string[]
): string[] {
  return Array.from(
    new Set(
      values
        .map(value => value.trim())
        .filter(Boolean)
    )
  );
}

function requireString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `${fieldName} is required to process an offer notification email.`
    );
  }

  return value.trim();
}
