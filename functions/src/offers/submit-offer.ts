import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  verifyOfferSubmissionEligibility,
} from './verify-offer-eligibility';

import {
  requireStateContractPackage,
} from './state-contracts/state-contract-registry';

import type {
  OfferDocument,
  OfferVersionDocument,
  SubmitOfferData,
  SubmitOfferResponse,
} from './offer-types';


/*
 * Validates and freezes the current offer or counteroffer
 * version before electronic signatures begin.
 *
 * Once submitted, the version can never be edited.
 */
export const submitOffer =
  onCall<
    SubmitOfferData,
    Promise<SubmitOfferResponse>
  >(
    callableFunctionOptions,
    async request => {
      const userUid =
        request.auth?.uid;

      if (!userUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must sign in before submitting an offer.'
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

      const offerReference =
        adminFirestore
          .collection('offers')
          .doc(offerUid);

      const versionReference =
        offerReference
          .collection('versions')
          .doc(offerVersionUid);

      const [
        initialOfferSnapshot,
        initialVersionSnapshot,
      ] = await Promise.all([
        offerReference.get(),
        versionReference.get(),
      ]);

      if (!initialOfferSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'The offer could not be found.'
        );
      }

      if (!initialVersionSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'The offer version could not be found.'
        );
      }

      const initialOffer =
        initialOfferSnapshot.data() as
          OfferDocument;

      /*
       * This also verifies that the listing remains active,
       * is accepting offers and is still owned by someone
       * other than the buyer.
       */
      await verifyOfferSubmissionEligibility(
        initialOffer.listingUid,
        initialOffer.primaryBuyerUid
      );

      await adminFirestore.runTransaction(
        async transaction => {
          const listingReference =
            adminFirestore
              .collection('listings')
              .doc(
                initialOffer.listingUid
              );

          const [
            offerSnapshot,
            versionSnapshot,
            listingSnapshot,
          ] = await Promise.all([
            transaction.get(
              offerReference
            ),

            transaction.get(
              versionReference
            ),

            transaction.get(
              listingReference
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

          if (!listingSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The property listing could not be found.'
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

          const listingData =
            listingSnapshot.data();

          if (!listingData) {
            throw new HttpsError(
              'data-loss',
              'The property listing contains no data.'
            );
          }

          verifySubmissionAccess(
            offer,
            version,
            userUid,
            offerVersionUid
          );

          verifyListingStillActive(
            listingData
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

          stateContractPackage
            .validateSubmission({
              offer,
              version,
            });

          const now =
            Timestamp.now();

          const shouldIncrementPendingOfferCount =
            offer.pendingOfferCounted !== true;

          transaction.update(
            versionReference,
            {
              status:
                'awaiting_signatures',

              immutable: true,

              lockedAt: now,
              lockedByUid: userUid,

              submittedAt: now,
              updatedAt: now,

              statusHistory:
                FieldValue.arrayUnion({
                  fromStatus: 'draft',

                  toStatus:
                    'awaiting_signatures',

                  action: 'submitted',

                  actorUid: userUid,

                  actorRole:
                    version.initiatedBy,

                  note:
                    'Offer version locked for document generation and electronic signatures.',

                  occurredAt: now,
                }),
            }
          );

          transaction.update(
            offerReference,
            {
              status: 'submitted',

              pendingOfferCounted: true,

              submittedAt:
                offer.submittedAt ??
                now,

              lastActivityAt: now,
              updatedAt: now,

              statusHistory:
                FieldValue.arrayUnion({
                  fromStatus:
                    offer.status,

                  toStatus:
                    'submitted',

                  action:
                    'submitted',

                  actorUid: userUid,

                  actorRole:
                    version.initiatedBy,

                  offerVersionUid,
                  offerVersionNumber:
                    version.versionNumber,

                  occurredAt: now,
                }),
            }
          );

          if (shouldIncrementPendingOfferCount) {
            transaction.update(
              listingReference,
              {
                pendingOfferCount:
                  FieldValue.increment(1),

                updatedAt: now,
              }
            );
          }
        }
      );

      return {
        success: true,
      };
    }
  );


function verifySubmissionAccess(
  offer: OfferDocument,
  version: OfferVersionDocument,
  userUid: string,
  offerVersionUid: string
): void {
  if (
    offer.currentVersionUid !==
    offerVersionUid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This is no longer the current offer version. Refresh the offer before submitting.'
    );
  }

  if (
    version.status !== 'draft' ||
    version.immutable
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer version has already been submitted or locked.'
    );
  }

  if (
    version.initiatedByUid !==
    userUid
  ) {
    throw new HttpsError(
      'permission-denied',
      'Only the party who created this version may submit it.'
    );
  }

  const authorized =
    version.initiatedBy === 'buyer'
      ? offer.buyerUids.includes(
        userUid
      )
      : offer.sellerUids.includes(
        userUid
      );

  if (!authorized) {
    throw new HttpsError(
      'permission-denied',
      'You do not have permission to submit this offer version.'
    );
  }
}


function verifyListingStillActive(
  listingData:
    Record<string, unknown>
): void {
  const status =
    listingData['status'];

  if (
    typeof status !== 'string' ||
    status.trim().toLowerCase() !==
      'active'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This property is no longer active.'
    );
  }

  if (
    listingData[
      'acceptingOffers'
    ] === false
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This property is not currently accepting offers.'
    );
  }
}


function requireIdentifier(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new HttpsError(
      'invalid-argument',
      fieldName + ' is required.'
    );
  }

  const normalizedValue =
    value.trim();

  if (
    normalizedValue.length > 200 ||
    normalizedValue.includes('/')
  ) {
    throw new HttpsError(
      'invalid-argument',
      fieldName + ' is invalid.'
    );
  }

  return normalizedValue;
}
