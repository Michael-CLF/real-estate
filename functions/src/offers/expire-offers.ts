import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import * as logger from
  'firebase-functions/logger';

import {
  onSchedule,
} from 'firebase-functions/v2/scheduler';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import {
  FUNCTION_REGION,
} from '../shared/function-options';

import {
  addOfferNotificationToTransaction,
} from './offer-notification.service';

import type {
  OfferDocument,
  OfferVersionDocument,
} from './offer-types';


const EXPIRABLE_OFFER_STATUSES =
  new Set([
    'submitted',
    'viewed',
    'countered',
  ]);

const EXPIRABLE_VERSION_STATUSES =
  new Set([
    'awaiting_signatures',
    'submitted',
    'delivered',
  ]);

const MAXIMUM_OFFERS_PER_RUN = 100;


/*
 * Removes the Offer Pending badge when the contractual
 * expiration time passes without acceptance.
 *
 * The listing itself remains active and continues accepting
 * new offers. Drafts are never expired by this job.
 */
export const expireOffers =
  onSchedule(
    {
      schedule: 'every 15 minutes',
      timeZone:
        'UTC',
      region:
        FUNCTION_REGION,
      maxInstances: 1,
      timeoutSeconds: 300,
      memory: '256MiB',
    },
    async () => {
      const candidatesSnapshot =
        await adminFirestore
          .collection('offers')
          .where(
            'pendingOfferCounted',
            '==',
            true
          )
          .limit(
            MAXIMUM_OFFERS_PER_RUN
          )
          .get();

      let expiredCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (
        const candidateSnapshot of
        candidatesSnapshot.docs
      ) {
        try {
          const expired =
            await expireOfferIfRequired(
              candidateSnapshot.id
            );

          if (expired) {
            expiredCount += 1;
          } else {
            skippedCount += 1;
          }
        } catch (error) {
          failedCount += 1;

          logger.error(
            'Unable to expire offer.',
            {
              offerUid:
                candidateSnapshot.id,
              error,
            }
          );
        }
      }

      logger.info(
        'Offer expiration run completed.',
        {
          candidateCount:
            candidatesSnapshot.size,
          expiredCount,
          skippedCount,
          failedCount,
        }
      );
    }
  );


async function expireOfferIfRequired(
  offerUid: string
): Promise<boolean> {
  const offerReference =
    adminFirestore
      .collection('offers')
      .doc(offerUid);

  return adminFirestore.runTransaction(
    async transaction => {
      const offerSnapshot =
        await transaction.get(
          offerReference
        );

      if (!offerSnapshot.exists) {
        return false;
      }

      const offer =
        offerSnapshot.data() as
          OfferDocument;

      if (
        offer.pendingOfferCounted !==
          true ||
        !EXPIRABLE_OFFER_STATUSES.has(
          offer.status
        )
      ) {
        return false;
      }

      const offerVersionUid =
        requireIdentifier(
          offer.currentVersionUid,
          'currentVersionUid'
        );

      const versionReference =
        offerReference
          .collection('versions')
          .doc(offerVersionUid);

      const versionSnapshot =
        await transaction.get(
          versionReference
        );

      if (!versionSnapshot.exists) {
        throw new Error(
          'The current offer version could not be found.'
        );
      }

      const version =
        versionSnapshot.data() as
          OfferVersionDocument;

      /*
       * A counteroffer draft may be resumed. It has no
       * contractual expiration until it is submitted.
       */
      if (
        version.status === 'draft' ||
        version.immutable !== true ||
        !EXPIRABLE_VERSION_STATUSES.has(
          version.status
        )
      ) {
        return false;
      }

      const expirationDate =
        parseExpirationDate(
          version.expiresAt
        );

      const now =
        Timestamp.now();

      if (
        expirationDate.getTime() >
        now.toMillis()
      ) {
        return false;
      }

      const listingReference =
        adminFirestore
          .collection('listings')
          .doc(
            requireIdentifier(
              offer.listingUid,
              'listingUid'
            )
          );

      const listingSnapshot =
        await transaction.get(
          listingReference
        );

      if (!listingSnapshot.exists) {
        throw new Error(
          'The property listing could not be found.'
        );
      }

      const storedPendingOfferCount =
        listingSnapshot.get(
          'pendingOfferCount'
        );

      const nextPendingOfferCount =
        Math.max(
          0,
          (
            typeof storedPendingOfferCount ===
              'number'
              ? storedPendingOfferCount
              : 0
          ) - 1
        );

      transaction.update(
        versionReference,
        {
          status: 'expired',
          expiredAt: now,
          updatedAt: now,

          statusHistory:
            FieldValue.arrayUnion({
              fromStatus:
                version.status,
              toStatus: 'expired',
              action: 'expired',
              actorUid: 'system',
              actorRole: 'system',
              note:
                'Offer version expired automatically at the contractual expiration time.',
              occurredAt: now,
            }),
        }
      );

      transaction.update(
        offerReference,
        {
          status: 'expired',
          pendingOfferCounted: false,
          closedReason: 'expired',
          closedAt: now,
          lastActivityAt: now,
          updatedAt: now,

          statusHistory:
            FieldValue.arrayUnion({
              fromStatus:
                offer.status,
              toStatus: 'expired',
              action: 'expired',
              actorUid: 'system',
              actorRole: 'system',
              offerVersionUid,
              offerVersionNumber:
                version.versionNumber,
              note:
                'Offer expired automatically without acceptance.',
              occurredAt: now,
            }),
        }
      );

      transaction.update(
        listingReference,
        {
          pendingOfferCount:
            nextPendingOfferCount,
          updatedAt: now,
        }
      );

      const recipientUids =
        Array.from(
          new Set([
            ...offer.buyerUids,
            ...offer.sellerUids,
          ])
        )
          .filter(Boolean);

      for (
        const recipientUid of
        recipientUids
      ) {
        addOfferNotificationToTransaction(
          transaction,
          adminFirestore,
          {
            recipientUid,
            actorUid: null,
            offerUid,
            offerVersionUid,
            listingUid:
              offer.listingUid,
            type:
              'offer_expired',
            title:
              'Offer expired',
            message:
              `Offer ${offer.referenceNumber}-V${version.versionNumber} expired without acceptance. The complete offer history remains available in your dashboard.`,
            channels: [
              'in_app',
              'email',
            ],
            eventKey:
              'contractual-expiration',
            metadata: {
              referenceNumber:
                offer.referenceNumber,
              versionNumber:
                version.versionNumber,
            },
          }
        );
      }

      return true;
    }
  );
}


function parseExpirationDate(
  value: string
): Date {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new Error(
      'The submitted offer version does not contain an expiration time.'
    );
  }

  const expirationDate =
    new Date(value);

  if (
    Number.isNaN(
      expirationDate.getTime()
    )
  ) {
    throw new Error(
      'The submitted offer version contains an invalid expiration time.'
    );
  }

  return expirationDate;
}


function requireIdentifier(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9_-]{1,160}$/.test(
      value
    )
  ) {
    throw new Error(
      `${fieldName} is invalid.`
    );
  }

  return value;
}
