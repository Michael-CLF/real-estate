import {
  FieldValue,
  getFirestore,
  type DocumentReference
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
  offerVersionUid?: string | null;
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

  primaryBuyerUid?: string;
  buyerUids?: string[];

  primarySellerUid?: string;
  sellerUids?: string[];

  listingUid?: string;
  currentVersionUid?: string;
  lastDeliveredVersionUid?: string;

  status?: string;
  pendingOfferCounted?: boolean;
}

interface OfferVersionRecord {
  Uid?: string;
  versionNumber?: number;
  initiatedBy?: 'buyer' | 'seller';
  status?: string;
}

const withdrawableOfferStatuses =
  new Set([
    'draft',
    'submitted',
    'viewed',
    'countered'
  ]);

const privateVersionStatuses =
  new Set([
    'draft',
    'awaiting_signatures',
    'partially_signed'
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

    const requestedOfferVersionUid =
      normalizeOptionalString(
        request.data?.offerVersionUid
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

        const offerVersionUid =
          requireNonEmptyString(
            offer.currentVersionUid,
            'currentVersionUid'
          );

        if (
          requestedOfferVersionUid &&
          requestedOfferVersionUid !==
            offerVersionUid
        ) {
          throw new HttpsError(
            'failed-precondition',
            'The offer changed. Refresh the page and try again.'
          );
        }

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

        const version =
          versionSnapshot.data() as
            OfferVersionRecord | undefined;

        if (!version) {
          throw new HttpsError(
            'data-loss',
            'The current offer version contains no data.'
          );
        }

        const actorRole =
          verifyInitiatingPartyAccess(
            offer,
            version,
            userUid
          );

        const isPrivateInitialDraft =
          version.versionNumber === 1 &&
          offer.status === 'draft' &&
          privateVersionStatuses.has(
            version.status ?? ''
          );

        const wasDelivered =
          offer.lastDeliveredVersionUid ===
            offerVersionUid ||
          offer.pendingOfferCounted === true;

        if (
          !isPrivateInitialDraft &&
          !wasDelivered
        ) {
          throw new HttpsError(
            'failed-precondition',
            'This private draft cannot be withdrawn from this screen.'
          );
        }

        const listingUid =
          requireNonEmptyString(
            offer.listingUid,
            'listingUid'
          );

        const shouldRemovePendingOffer =
          wasDelivered &&
          offer.pendingOfferCounted === true;

        let listingReference:
          DocumentReference |
          null = null;

        let nextPendingOfferCount = 0;

        if (shouldRemovePendingOffer) {
          listingReference =
            firestore
              .collection('listings')
              .doc(listingUid);

          const listingSnapshot =
            await transaction.get(
              listingReference
            );

          if (!listingSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The property listing could not be found.'
            );
          }

          const storedPendingOfferCount =
            listingSnapshot.get(
              'pendingOfferCount'
            );

          nextPendingOfferCount =
            Math.max(
              0,
              (
                typeof storedPendingOfferCount ===
                  'number'
                  ? storedPendingOfferCount
                  : 0
              ) - 1
            );
        }

        const eventReference =
          offerReference
            .collection('events')
            .doc();

        transaction.update(
          offerReference,
          {
            status: 'withdrawn',
            withdrawnByUid: userUid,
            withdrawnAt:
              FieldValue.serverTimestamp(),
            withdrawalReason: reason,
            ...(shouldRemovePendingOffer
              ? {
                  pendingOfferCounted: false
                }
              : {}),
            updatedAt:
              FieldValue.serverTimestamp()
          }
        );

        if (
          shouldRemovePendingOffer &&
          listingReference
        ) {
          transaction.update(
            listingReference,
            {
              pendingOfferCount:
                nextPendingOfferCount,
              updatedAt:
                FieldValue.serverTimestamp()
            }
          );
        }

        transaction.update(
          versionReference,
          {
            status: 'withdrawn',
            withdrawnByUid: userUid,
            withdrawnAt:
              FieldValue.serverTimestamp(),
            withdrawalReason: reason,
            updatedAt:
              FieldValue.serverTimestamp()
          }
        );

        transaction.set(
          eventReference,
          {
            Uid: eventReference.id,
            offerUid,
            offerVersionUid,
            listingUid,
            eventType:
              isPrivateInitialDraft
                ? 'offer_draft_discarded'
                : 'offer_withdrawn',
            actorUid: userUid,
            actorRole,
            reason,
            createdAt:
              FieldValue.serverTimestamp()
          }
        );

        if (wasDelivered) {
          const recipientUids =
            actorRole === 'buyer'
              ? getSellerUids(offer)
              : getBuyerUids(offer);

          for (
            const recipientUid of
              recipientUids
          ) {
            addOfferNotificationToTransaction(
              transaction,
              firestore,
              {
                recipientUid,
                actorUid: userUid,
                offerUid,
                offerVersionUid,
                listingUid,
                type: 'offer_withdrawn',
                title:
                  actorRole === 'buyer'
                    ? 'Buyer withdrew an offer'
                    : 'Seller withdrew a counteroffer',
                message:
                  reason
                    ? (
                        'The initiating party withdrew the offer. ' +
                        `Reason: ${reason}`
                      )
                    : (
                        'The initiating party withdrew the offer. ' +
                        'The offer remains available in the historical record.'
                      ),
                channels: [
                  'in_app',
                  'email'
                ],
                eventKey:
                  `${actorRole}-withdrew`,
                metadata: {
                  reason
                }
              }
            );
          }
        }

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


function verifyInitiatingPartyAccess(
  offer: OfferRecord,
  version: OfferVersionRecord,
  userUid: string
): 'buyer' | 'seller' {
  const buyerUids =
    getBuyerUids(offer);

  const sellerUids =
    getSellerUids(offer);

  if (
    version.initiatedBy === 'buyer' &&
    buyerUids.includes(userUid)
  ) {
    return 'buyer';
  }

  if (
    version.initiatedBy === 'seller' &&
    sellerUids.includes(userUid)
  ) {
    return 'seller';
  }

  throw new HttpsError(
    'permission-denied',
    'Only the party who initiated the current version may withdraw it.'
  );
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
    !withdrawableOfferStatuses.has(
      offer.status
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer can no longer be withdrawn.'
    );
  }
}


function getBuyerUids(
  offer: OfferRecord
): string[] {
  return uniqueStrings([
    ...(offer.buyerUids ?? []),
    offer.primaryBuyerUid
  ]);
}


function getSellerUids(
  offer: OfferRecord
): string[] {
  return uniqueStrings([
    ...(offer.sellerUids ?? []),
    offer.primarySellerUid
  ]);
}


function uniqueStrings(
  values: Array<string | undefined>
): string[] {
  return Array.from(
    new Set(
      values.filter(
        (
          value
        ): value is string =>
          typeof value === 'string' &&
          value.trim().length > 0
      ).map(
        value =>
          value.trim()
      )
    )
  );
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
