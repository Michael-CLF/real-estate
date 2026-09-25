import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  FieldValue,
  Timestamp
} from 'firebase-admin/firestore';

import {
  adminFirestore
} from '../shared/firebase-admin';

import {
  callableFunctionOptions
} from '../shared/function-options';

import {
  requireStateContractPackage
} from './state-contracts/state-contract-registry';

import type {
  CreateCounterofferData,
  CreateCounterofferResponse,
  OfferDocument,
  OfferInitiatingParty,
  OfferTermsDocument,
  OfferVersionDocument,
  OfferVersionPartySnapshotDocument
} from './offer-types';


const COUNTERABLE_VERSION_STATUSES =
  new Set([
    'signed',
    'delivered'
  ]);


/*
 * Creates a new editable version from the current signed
 * offer or counteroffer.
 *
 * Creating the draft does not send it to the other party.
 * Delivery occurs only after the initiating party signs it.
 */
export const createCounteroffer =
  onCall<
    CreateCounterofferData,
    Promise<CreateCounterofferResponse>
  >(
    callableFunctionOptions,

    async request => {
      const userUid =
        request.auth?.uid;

      if (!userUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must sign in before creating a counteroffer.'
        );
      }

      const offerUid =
        requireIdentifier(
          request.data?.offerUid,
          'offerUid'
        );

      const sourceVersionUid =
        requireIdentifier(
          request.data?.sourceVersionUid,
          'sourceVersionUid'
        );

      const offerReference =
        adminFirestore
          .collection('offers')
          .doc(offerUid);

      const sourceVersionReference =
        offerReference
          .collection('versions')
          .doc(sourceVersionUid);

      const counterofferReference =
        offerReference
          .collection('versions')
          .doc();

      const response =
        await adminFirestore.runTransaction(
          async transaction => {
            const [
              offerSnapshot,
              sourceVersionSnapshot
            ] = await Promise.all([
              transaction.get(
                offerReference
              ),

              transaction.get(
                sourceVersionReference
              )
            ]);

            if (!offerSnapshot.exists) {
              throw new HttpsError(
                'not-found',
                'The offer could not be found.'
              );
            }

            if (!sourceVersionSnapshot.exists) {
              throw new HttpsError(
                'not-found',
                'The offer version could not be found.'
              );
            }

            const offer =
              offerSnapshot.data() as
              OfferDocument;

            const sourceVersion =
              sourceVersionSnapshot.data() as
              OfferVersionDocument;

            const stateContractPackage =
              requireStateContractPackage(
                offer.stateCode
              );

            if (
              sourceVersion.stateCode !==
              stateContractPackage.stateCode ||
              sourceVersion.terms.stateCode !==
              stateContractPackage.stateCode
            ) {
              throw new HttpsError(
                'data-loss',
                'The offer state does not match its current contract version.'
              );
            }

            verifyCounterofferAccess(
              offer,
              sourceVersion,
              userUid,
              sourceVersionUid
            );

            const initiatingParty =
              getCounteringParty(
                sourceVersion.initiatedBy
              );

            const nextVersionNumber =
              offer.totalVersions + 1;

            const now =
              Timestamp.now();

            const buyers =
              resetPartySignatures(
                sourceVersion.buyers
              );

            const sellers =
              resetPartySignatures(
                sourceVersion.sellers
              );

            const counterofferData =
              removeUndefinedValues({
                Uid:
                  counterofferReference.id,

                offerUid,

                versionNumber:
                  nextVersionNumber,

                parentVersionUid:
                  sourceVersionUid,

                initiatedBy:
                  initiatingParty,

                initiatedByUid:
                  userUid,

                status:
                  'draft',

                stateCode:
                  stateContractPackage.stateCode,

                terms:
                  createCounterofferTerms(
                    sourceVersion.terms
                  ),

                buyers,
                sellers,

                changesFromPreviousVersion:
                  [],

                documents:
                  [],

                statusHistory: [
                  {
                    toStatus:
                      'draft',

                    action:
                      'created',

                    actorUid:
                      userUid,

                    actorRole:
                      initiatingParty,

                    note:
                      `Counteroffer Version ${nextVersionNumber} created from Version ${sourceVersion.versionNumber}.`,

                    occurredAt:
                      now
                  }
                ],

                immutable:
                  false,

                /*
                 * The countering party must choose a new
                 * expiration before preparing the version.
                 */
                expiresAt:
                  '',

                createdAt:
                  now,

                updatedAt:
                  now
              });

            transaction.create(
              counterofferReference,
              counterofferData
            );

            transaction.update(
              offerReference,
              {
                status:
                  'draft',

                currentVersionUid:
                  counterofferReference.id,

                currentVersionNumber:
                  nextVersionNumber,

                currentVersionInitiatedBy:
                  initiatingParty,

                /*
                 * The receiving party continues to see the
                 * last version that was actually delivered.
                 */
                lastDeliveredVersionUid:
                  offer.lastDeliveredVersionUid ??
                  sourceVersionUid,

                versionUids:
                  FieldValue.arrayUnion(
                    counterofferReference.id
                  ),

                totalVersions:
                  nextVersionNumber,

                statusHistory:
                  FieldValue.arrayUnion({
                    fromStatus:
                      offer.status,

                    toStatus:
                      'draft',

                    action:
                      'draft_created',

                    actorUid:
                      userUid,

                    actorRole:
                      initiatingParty,

                    offerVersionUid:
                      counterofferReference.id,

                    offerVersionNumber:
                      nextVersionNumber,

                    note:
                      `Counteroffer Version ${nextVersionNumber} draft created.`,

                    occurredAt:
                      now
                  }),

                lastActivityAt:
                  now,

                updatedAt:
                  now
              }
            );

            return {
              offerUid,

              offerVersionUid:
                counterofferReference.id,

              offerVersionNumber:
                nextVersionNumber
            };
          }
        );

      return response;
    }
  );


function verifyCounterofferAccess(
  offer: OfferDocument,
  sourceVersion: OfferVersionDocument,
  userUid: string,
  sourceVersionUid: string
): void {
  if (
    offer.currentVersionUid !==
    sourceVersionUid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This is no longer the current offer version. Refresh the offer before responding.'
    );
  }

  if (
    offer.status !== 'submitted' &&
    offer.status !== 'viewed' &&
    offer.status !== 'countered'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer is not available for a counteroffer.'
    );
  }

  if (
    !sourceVersion.immutable ||
    !COUNTERABLE_VERSION_STATUSES.has(
      sourceVersion.status
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer version is not ready for a counteroffer.'
    );
  }

  const receivingParty =
    getCounteringParty(
      sourceVersion.initiatedBy
    );

  const authorized =
    receivingParty === 'buyer'
      ? offer.buyerUids.includes(
        userUid
      )
      : offer.sellerUids.includes(
        userUid
      );

  if (!authorized) {
    throw new HttpsError(
      'permission-denied',
      'Only the party who received this version may create a counteroffer.'
    );
  }
}


function getCounteringParty(
  initiatingParty: OfferInitiatingParty
): OfferInitiatingParty {
  return initiatingParty === 'buyer'
    ? 'seller'
    : 'buyer';
}


function resetPartySignatures(
  parties:
    OfferVersionPartySnapshotDocument[]
): OfferVersionPartySnapshotDocument[] {
  return parties.map(
    party =>
      removeUndefinedValues({
        ...party,

        signature: {
          status:
            'not_started'
        },

        electronicTransactionsConsentAccepted:
          false,

        electronicTransactionsConsentAcceptedAt:
          undefined
      }) as
      OfferVersionPartySnapshotDocument
  );
}


function createCounterofferTerms(
  sourceTerms: OfferTermsDocument
): OfferTermsDocument {
  const terms =
    clonePlainValue(
      sourceTerms
    );

  return {
    ...terms,

    delivery: {
      ...terms.delivery,

      expiresAt: '',

      electronicDeliveryAuthorized:
        false
    }
  };
}


function clonePlainValue<T>(
  value: T
): T {
  if (Array.isArray(value)) {
    return value.map(
      item =>
        clonePlainValue(item)
    ) as T;
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof Timestamp) &&
    !(value instanceof FieldValue)
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<string, unknown>
      ).map(
        ([key, nestedValue]) => [
          key,
          clonePlainValue(
            nestedValue
          )
        ]
      )
    ) as T;
  }

  return value;
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
      `${fieldName} is required.`
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
      `${fieldName} is invalid.`
    );
  }

  return normalizedValue;
}


function removeUndefinedValues<T>(
  value: T
): T {
  if (Array.isArray(value)) {
    return value.map(
      item =>
        removeUndefinedValues(item)
    ) as T;
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof Timestamp) &&
    !(value instanceof FieldValue)
  ) {
    return Object.fromEntries(
      Object.entries(
        value as Record<string, unknown>
      )
        .filter(
          ([, nestedValue]) =>
            nestedValue !== undefined
        )
        .map(
          ([key, nestedValue]) => [
            key,
            removeUndefinedValues(
              nestedValue
            )
          ]
        )
    ) as T;
  }

  return value;
}
