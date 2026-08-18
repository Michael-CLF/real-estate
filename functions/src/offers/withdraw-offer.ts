import {
  FieldValue,
  getFirestore
} from 'firebase-admin/firestore';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  addOfferNotificationToTransaction
} from './offer-notification.service';

interface WithdrawOfferRequest {
  offerUid: string;
  reason?: string | null;
}

interface WithdrawOfferResponse {
  offerUid: string;
  offerVersionUid: string;
  status: 'withdrawn';
  alreadyWithdrawn: boolean;
}

interface OfferRecord {
  Uid?: string;

  buyerUid?: string;
  sellerUid?: string;

  listingUid?: string;
  currentVersionUid?: string;

  status?: string;
}

const nonWithdrawableStatuses = new Set([
  'rejected',
  'withdrawn',
  'expired',
  'fully_executed',
  'executed',
  'voided',
  'cancelled'
]);

export const withdrawOffer = onCall<
  WithdrawOfferRequest,
  Promise<WithdrawOfferResponse>
>(
  {
    region: 'us-east1'
  },

  async request => {
    const userUid =
      request.auth?.uid;

    if (!userUid) {
      throw new HttpsError(
        'unauthenticated',
        'You must be signed in to withdraw an offer.'
      );
    }

    const offerUid =
      requireNonEmptyString(
        request.data?.offerUid,
        'offerUid'
      );

    const reason =
      normalizeOptionalString(
        request.data?.reason
      );

    const firestore =
      getFirestore();

    const offerReference =
      firestore
        .collection('offers')
        .doc(offerUid);

    return firestore.runTransaction(
      async transaction => {
        const offerSnapshot =
          await transaction.get(
            offerReference
          );

        if (!offerSnapshot.exists) {
          throw new HttpsError(
            'not-found',
            'The requested offer does not exist.'
          );
        }

        const offer =
          offerSnapshot.data() as
            OfferRecord | undefined;

        if (!offer) {
          throw new HttpsError(
            'data-loss',
            'The stored offer contains no data.'
          );
        }

        verifyBuyerAccess(
          offer,
          userUid
        );

        const offerVersionUid =
          requireNonEmptyString(
            offer.currentVersionUid,
            'currentVersionUid'
          );

        if (offer.status === 'withdrawn') {
          return {
            offerUid,
            offerVersionUid,
            status: 'withdrawn',
            alreadyWithdrawn: true
          };
        }

        verifyOfferCanBeWithdrawn(
          offer
        );

        const sellerUid =
          requireNonEmptyString(
            offer.sellerUid,
            'sellerUid'
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
          throw new HttpsError(
            'not-found',
            'The current offer version does not exist.'
          );
        }

        const eventReference =
          offerReference
            .collection('events')
            .doc();

        transaction.update(
          offerReference,
          {
            status:
              'withdrawn',

            withdrawnByUid:
              userUid,

            withdrawnAt:
              FieldValue.serverTimestamp(),

            withdrawalReason:
              reason,

            updatedAt:
              FieldValue.serverTimestamp()
          }
        );

        transaction.update(
          versionReference,
          {
            status:
              'withdrawn',

            withdrawnByUid:
              userUid,

            withdrawnAt:
              FieldValue.serverTimestamp(),

            withdrawalReason:
              reason,

            updatedAt:
              FieldValue.serverTimestamp()
          }
        );

        transaction.set(
          eventReference,
          {
            Uid:
              eventReference.id,

            offerUid,
            offerVersionUid,

            listingUid:
              offer.listingUid ?? null,

            eventType:
              'buyer_withdrew_offer',

            actorUid:
              userUid,

            actorRole:
              'buyer',

            reason,

            createdAt:
              FieldValue.serverTimestamp()
          }
        );

        addOfferNotificationToTransaction(
          transaction,
          firestore,
          {
            recipientUid:
              sellerUid,

            actorUid:
              userUid,

            offerUid,
            offerVersionUid,

            listingUid:
              offer.listingUid ?? null,

            type:
              'offer_withdrawn',

            title:
              'Buyer withdrew an offer',

            message:
              reason
                ? (
                    'The buyer withdrew the offer. ' +
                    `Reason: ${reason}`
                  )
                : (
                    'The buyer withdrew the offer. ' +
                    'The offer remains available in the historical record.'
                  ),

            channels: [
              'in_app',
              'email'
            ],

            eventKey:
              'buyer-withdrew',

            metadata: {
              reason
            }
          }
        );

        return {
          offerUid,
          offerVersionUid,
          status: 'withdrawn',
          alreadyWithdrawn: false
        };
      }
    );
  }
);

function verifyBuyerAccess(
  offer: OfferRecord,
  userUid: string
): void {
  if (!offer.buyerUid) {
    throw new HttpsError(
      'data-loss',
      'The offer does not identify a buyer.'
    );
  }

  if (offer.buyerUid !== userUid) {
    throw new HttpsError(
      'permission-denied',
      'Only the buyer who created the offer may withdraw it.'
    );
  }
}

function verifyOfferCanBeWithdrawn(
  offer: OfferRecord
): void {
  if (!offer.status) {
    throw new HttpsError(
      'data-loss',
      'The offer does not contain a status.'
    );
  }

  if (
    nonWithdrawableStatuses.has(
      offer.status
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer can no longer be withdrawn.'
    );
  }
}

function requireNonEmptyString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} is required.`
    );
  }

  return value.trim();
}

function normalizeOptionalString(
  value: unknown
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}