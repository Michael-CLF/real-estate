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

type SellerDecision =
  | 'accept'
  | 'reject';

interface RespondToOfferRequest {
  offerUid: string;
  offerVersionUid: string;
  decision: SellerDecision;
}

interface RespondToOfferResponse {
  offerUid: string;
  offerVersionUid: string;
  decision: SellerDecision;
  offerStatus: string;
  versionStatus: string;
  alreadyProcessed: boolean;
}

interface OfferRecord {
  Uid?: string;
  buyerUid?: string;
  sellerUid?: string;
  listingUid?: string;
  currentVersionUid?: string;
  status?: string;
}

interface OfferVersionRecord {
  Uid?: string;
  offerUid?: string;
  createdByUid?: string;
  status?: string;
  sellerDecision?: SellerDecision;
  sellerRespondedAt?: unknown;
}

const allowedOfferStatuses = new Set([
  'submitted',
  'seller_review',
  'awaiting_seller_response',
  'awaiting_signatures'
]);

const allowedVersionStatuses = new Set([
  'submitted',
  'seller_review',
  'awaiting_seller_response',
  'awaiting_signatures'
]);

export const respondToOffer = onCall<
  RespondToOfferRequest,
  Promise<RespondToOfferResponse>
>(
  {
    region: 'us-east1'
  },

  async request => {
    const userUid = request.auth?.uid;

    if (!userUid) {
      throw new HttpsError(
        'unauthenticated',
        'You must be signed in to respond to an offer.'
      );
    }

    const offerUid =
      requireNonEmptyString(
        request.data?.offerUid,
        'offerUid'
      );

    const offerVersionUid =
      requireNonEmptyString(
        request.data?.offerVersionUid,
        'offerVersionUid'
      );

    const decision =
      validateDecision(
        request.data?.decision
      );

    const firestore = getFirestore();

    const offerReference =
      firestore
        .collection('offers')
        .doc(offerUid);

    const versionReference =
      offerReference
        .collection('versions')
        .doc(offerVersionUid);

    return firestore.runTransaction(
      async transaction => {
        const [
          offerSnapshot,
          versionSnapshot
        ] = await Promise.all([
          transaction.get(offerReference),
          transaction.get(versionReference)
        ]);

        if (!offerSnapshot.exists) {
          throw new HttpsError(
            'not-found',
            'The requested offer does not exist.'
          );
        }

        if (!versionSnapshot.exists) {
          throw new HttpsError(
            'not-found',
            'The requested offer version does not exist.'
          );
        }

        const offer =
          offerSnapshot.data() as
          OfferRecord | undefined;

        const version =
          versionSnapshot.data() as
          OfferVersionRecord | undefined;

        if (!offer) {
          throw new HttpsError(
            'data-loss',
            'The stored offer contains no data.'
          );
        }

        if (!version) {
          throw new HttpsError(
            'data-loss',
            'The stored offer version contains no data.'
          );
        }

        verifySellerAccess(
          offer,
          userUid
        );

        const buyerUid =
          requireOfferBuyerUid(
            offer
          );

        verifyVersionBelongsToOffer(
          version,
          offerUid
        );

        verifyCurrentVersion(
          offer,
          offerVersionUid
        );

        /*
         * Make a repeated request idempotent.
         *
         * This protects against double-clicks, browser retries,
         * slow network retries and callable-function retries.
         */
        if (
          version.sellerDecision === decision &&
          (
            offer.status === 'accepted' ||
            offer.status === 'rejected'
          )
        ) {
          return {
            offerUid,
            offerVersionUid,
            decision,
            offerStatus:
              offer.status,
            versionStatus:
              version.status ??
              offer.status,
            alreadyProcessed: true
          };
        }

        verifyOfferCanBeReviewed(
          offer
        );

        verifyVersionCanBeReviewed(
          version
        );

        const offerStatus =
          decision === 'accept'
            ? 'accepted'
            : 'rejected';

        const versionStatus =
          decision === 'accept'
            ? 'accepted'
            : 'rejected';

        const responseEventReference =
          offerReference
            .collection('events')
            .doc();

        transaction.update(
          versionReference,
          {
            status: versionStatus,
            sellerDecision: decision,
            sellerRespondedAt:
              FieldValue.serverTimestamp(),
            sellerRespondedByUid:
              userUid,
            updatedAt:
              FieldValue.serverTimestamp()
          }
        );

        transaction.update(
          offerReference,
          {
            status: offerStatus,
            sellerDecision: decision,
            sellerRespondedAt:
              FieldValue.serverTimestamp(),
            sellerRespondedByUid:
              userUid,
            updatedAt:
              FieldValue.serverTimestamp()
          }
        );

        transaction.set(
          responseEventReference,
          {
            Uid:
              responseEventReference.id,

            offerUid,
            offerVersionUid,

            listingUid:
              offer.listingUid ?? null,

            eventType:
              decision === 'accept'
                ? 'seller_accepted_offer'
                : 'seller_rejected_offer',

            actorUid:
              userUid,

            actorRole:
              'seller',

            decision,

            offerStatus,
            versionStatus,

            createdAt:
              FieldValue.serverTimestamp()
          }
        );

        addOfferNotificationToTransaction(
          transaction,
          firestore,
          {
            recipientUid:
              buyerUid,

            actorUid:
              userUid,

            offerUid,
            offerVersionUid,

            listingUid:
              offer.listingUid ?? null,

            type:
              decision === 'accept'
                ? 'offer_accepted'
                : 'offer_rejected',

            title:
              decision === 'accept'
                ? 'Your offer was accepted'
                : 'Your offer was not accepted',

            message:
              decision === 'accept'
                ? (
                  'The seller accepted your offer. ' +
                  'The agreement must now be completed and signed ' +
                  'before the property is placed under contract.'
                )
                : (
                  'The seller declined your offer. ' +
                  'You can review the offer history from your dashboard.'
                ),

            channels: [
              'in_app',
              'email'
            ],

            eventKey:
              decision === 'accept'
                ? 'seller-accepted'
                : 'seller-rejected',

            metadata: {
              decision,
              offerStatus,
              versionStatus
            }
          }
        );

        /*
         * IMPORTANT:
         *
         * Accepting the offer does not yet change the listing
         * to under_contract.
         *
         * That must happen only after all required signatures
         * have been completed and the final agreement becomes
         * effective.
         */
        return {
          offerUid,
          offerVersionUid,
          decision,
          offerStatus,
          versionStatus,
          alreadyProcessed: false
        };
      }
    );
  }
);

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

function validateDecision(
  value: unknown
): SellerDecision {
  if (
    value !== 'accept' &&
    value !== 'reject'
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The seller decision must be accept or reject.'
    );
  }

  return value;
}

function verifySellerAccess(
  offer: OfferRecord,
  userUid: string
): void {
  if (!offer.sellerUid) {
    throw new HttpsError(
      'data-loss',
      'The offer does not identify a seller.'
    );
  }

  if (offer.sellerUid !== userUid) {
    throw new HttpsError(
      'permission-denied',
      'Only the property seller may respond to this offer.'
    );
  }
}

function verifyVersionBelongsToOffer(
  version: OfferVersionRecord,
  offerUid: string
): void {
  if (
    version.offerUid &&
    version.offerUid !== offerUid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The selected version does not belong to this offer.'
    );
  }
}

function verifyCurrentVersion(
  offer: OfferRecord,
  offerVersionUid: string
): void {
  if (!offer.currentVersionUid) {
    throw new HttpsError(
      'failed-precondition',
      'The offer does not have a current version.'
    );
  }

  if (
    offer.currentVersionUid !==
    offerVersionUid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Only the current offer version may be accepted or rejected.'
    );
  }
}

function requireOfferBuyerUid(
  offer: OfferRecord
): string {
  if (
    typeof offer.buyerUid !== 'string' ||
    offer.buyerUid.trim().length === 0
  ) {
    throw new HttpsError(
      'data-loss',
      'The offer does not identify a buyer.'
    );
  }

  return offer.buyerUid.trim();
}

function verifyOfferCanBeReviewed(
  offer: OfferRecord
): void {
  if (
    !offer.status ||
    !allowedOfferStatuses.has(
      offer.status
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer is not currently awaiting a seller response.'
    );
  }
}

function verifyVersionCanBeReviewed(
  version: OfferVersionRecord
): void {
  if (
    !version.status ||
    !allowedVersionStatuses.has(
      version.status
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer version is not currently awaiting a seller response.'
    );
  }
}