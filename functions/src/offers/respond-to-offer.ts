import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  addOfferNotificationToTransaction,
} from './offer-notification.service';

import {
  requireStateContractPackage,
} from './state-contracts/state-contract-registry';

import type {
  OfferDocument,
  OfferVersionDocument,
  RespondToOfferData,
  RespondToOfferResponse,
} from './offer-types';


const DECLINABLE_VERSION_STATUSES =
  new Set([
    'signed',
    'delivered',
  ]);


/*
 * Records a decline by the party who received the current
 * signed offer or counteroffer.
 *
 * Acceptance is completed by signOffer so an offer cannot
 * become a contract until the final required party signs.
 * Counteroffers and withdrawals use their dedicated
 * callable Functions.
 */
export const respondToOffer =
  onCall<
    RespondToOfferData,
    Promise<RespondToOfferResponse>
  >(
    callableFunctionOptions,
    async request => {
      const userUid =
        request.auth?.uid;

      if (!userUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must sign in before responding to an offer.'
        );
      }

      const offerUid =
        requireIdentifier(
          request.data?.offerUid,
          'offerUid'
        );

      const offerVersionUid =
        requireIdentifier(
          request.data?.offerVersionUid,
          'offerVersionUid'
        );

      const action =
        requireDeclineAction(
          request.data?.action
        );

      const note =
        normalizeOptionalNote(
          request.data?.note
        );

      const offerReference =
        adminFirestore
          .collection('offers')
          .doc(offerUid);

      const versionReference =
        offerReference
          .collection('versions')
          .doc(offerVersionUid);

      return adminFirestore.runTransaction(
        async transaction => {
          const [
            offerSnapshot,
            versionSnapshot,
          ] = await Promise.all([
            transaction.get(
              offerReference
            ),

            transaction.get(
              versionReference
            ),
          ]);

          if (!offerSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The offer could not be found.'
            );
          }

          if (!versionSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The offer version could not be found.'
            );
          }

          const offer =
            offerSnapshot.data() as
              OfferDocument;

          const version =
            versionSnapshot.data() as
              OfferVersionDocument;

          const stateContractPackage =
            requireStateContractPackage(
              offer.stateCode
            );

          if (
            version.stateCode !==
              stateContractPackage.stateCode ||
            version.terms.stateCode !==
              stateContractPackage.stateCode
          ) {
            throw new HttpsError(
              'data-loss',
              'The offer state does not match its current contract version.'
            );
          }

          if (
            offer.status === 'declined' &&
            version.status === 'declined'
          ) {
            return {
              offerUid,
              offerVersionUid,
              action,
              offerStatus: 'declined',
              listingStatusChanged:
                false,
            };
          }

          verifyCurrentVersion(
            offer,
            version,
            offerVersionUid
          );

          const actorRole =
            getReceivingPartyRole(
              version
            );

          verifyReceivingPartyAccess(
            offer,
            actorRole,
            userUid
          );

          const actorName =
            getPartyName(
              version,
              actorRole,
              userUid
            );

          const recipientUids =
            actorRole === 'buyer'
              ? offer.sellerUids
              : offer.buyerUids;

          const listingReference =
            adminFirestore
              .collection('listings')
              .doc(offer.listingUid);

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

          const now =
            Timestamp.now();

          const shouldRemovePendingOffer =
            offer.pendingOfferCounted ===
            true;

          transaction.update(
            versionReference,
            {
              status: 'declined',
              declinedAt: now,
              updatedAt: now,

              statusHistory:
                FieldValue.arrayUnion({
                  fromStatus:
                    version.status,

                  toStatus: 'declined',
                  action: 'declined',

                  actorUid: userUid,
                  actorRole,

                  ...(
                    note
                      ? {
                        note,
                      }
                      : {}
                  ),

                  occurredAt: now,
                }),
            }
          );

          transaction.update(
            offerReference,
            {
              status: 'declined',

              pendingOfferCounted:
                false,

              closedReason:
                'declined',

              closedAt: now,
              lastActivityAt: now,
              updatedAt: now,

              statusHistory:
                FieldValue.arrayUnion({
                  fromStatus:
                    offer.status,

                  toStatus: 'declined',
                  action: 'declined',

                  actorUid: userUid,
                  actorRole,

                  offerVersionUid,
                  offerVersionNumber:
                    version.versionNumber,

                  ...(
                    note
                      ? {
                        note,
                      }
                      : {}
                  ),

                  occurredAt: now,
                }),
            }
          );

          if (shouldRemovePendingOffer) {
            transaction.update(
              listingReference,
              {
                pendingOfferCount:
                  FieldValue.increment(-1),

                updatedAt: now,
              }
            );
          }

          for (
            const recipientUid of
              uniqueStrings(
                recipientUids
              )
          ) {
            addOfferNotificationToTransaction(
              transaction,
              adminFirestore,
              {
                recipientUid,
                actorUid: userUid,

                offerUid,
                offerVersionUid,

                listingUid:
                  offer.listingUid,

                type:
                  'offer_rejected',

                title:
                  `Offer ${offer.referenceNumber}-${version.versionNumber} was declined`,

                message:
                  `${actorName} declined the current offer version. The complete history remains available on your dashboard.`,

                propertyAddress:
                  formatPropertyAddress(
                    offer
                  ),

                channels: [
                  'in_app',
                  'email',
                ],

                eventKey:
                  `${actorRole}-declined`,

                metadata: {
                  referenceNumber:
                    offer.referenceNumber,

                  versionNumber:
                    version.versionNumber,

                  fromPartyRole:
                    actorRole,

                  fromPartyName:
                    actorName,
                },
              }
            );
          }

          return {
            offerUid,
            offerVersionUid,
            action,
            offerStatus: 'declined',
            listingStatusChanged:
              false,
          };
        }
      );
    }
  );


function verifyCurrentVersion(
  offer: OfferDocument,
  version: OfferVersionDocument,
  offerVersionUid: string
): void {
  if (
    offer.currentVersionUid !==
      offerVersionUid ||
    version.Uid !== offerVersionUid ||
    version.offerUid !== offer.Uid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This is no longer the current offer version.'
    );
  }

  if (
    !version.immutable ||
    !DECLINABLE_VERSION_STATUSES.has(
      version.status
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer version is not available for a response.'
    );
  }

  if (
    offer.status !== 'submitted' &&
    offer.status !== 'viewed' &&
    offer.status !== 'countered'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer transaction is no longer open.'
    );
  }
}


function getReceivingPartyRole(
  version: OfferVersionDocument
): 'buyer' | 'seller' {
  return version.initiatedBy ===
    'buyer'
    ? 'seller'
    : 'buyer';
}


function verifyReceivingPartyAccess(
  offer: OfferDocument,
  actorRole: 'buyer' | 'seller',
  userUid: string
): void {
  const authorized =
    actorRole === 'buyer'
      ? offer.buyerUids.includes(
        userUid
      )
      : offer.sellerUids.includes(
        userUid
      );

  if (!authorized) {
    throw new HttpsError(
      'permission-denied',
      'Only the party who received this offer version may decline it.'
    );
  }
}


function getPartyName(
  version: OfferVersionDocument,
  actorRole: 'buyer' | 'seller',
  userUid: string
): string {
  const parties =
    actorRole === 'buyer'
      ? version.buyers
      : version.sellers;

  const party =
    parties.find(
      candidate =>
        candidate.userUid ===
        userUid
    ) ?? parties[0];

  return party?.legalName ||
    (
      actorRole === 'buyer'
        ? 'Buyer'
        : 'Seller'
    );
}


function formatPropertyAddress(
  offer: OfferDocument
): string {
  return [
    offer.property.addressLine1,
    offer.property.city,
    offer.property.state,
    offer.property.zipCode,
  ]
    .filter(Boolean)
    .join(', ');
}


function requireDeclineAction(
  value: unknown
): 'decline' {
  if (value !== 'decline') {
    throw new HttpsError(
      'invalid-argument',
      'The supported response action is decline. Acceptance is completed by signing, and counteroffers use the counteroffer action.'
    );
  }

  return value;
}


function normalizeOptionalNote(
  value: unknown
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'The response note is invalid.'
    );
  }

  const normalized =
    value.trim();

  if (normalized.length > 1000) {
    throw new HttpsError(
      'invalid-argument',
      'The response note cannot exceed 1,000 characters.'
    );
  }

  return normalized || undefined;
}


function requireIdentifier(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} is required.`
    );
  }

  const normalized =
    value.trim();

  if (
    normalized.length > 200 ||
    normalized.includes('/')
  ) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} is invalid.`
    );
  }

  return normalized;
}


function uniqueStrings(
  values: string[]
): string[] {
  return Array.from(
    new Set(
      values.filter(Boolean)
    )
  );
}
