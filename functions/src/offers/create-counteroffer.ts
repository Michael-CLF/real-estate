import { resetPartySignatures, createCounterofferTerms } from './counteroffer-draft-data';
import { removeUndefinedValues } from './draft-value-cleanup';
import { readSouthCarolinaListingDisclosures } from './state-contracts/south-carolina/south-carolina-state-contract.package';
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
import { readCaliforniaListingDisclosures } from './state-contracts/california/california-state-contract.package';
import { assertLouisianaListingDisclosures } from './louisiana-listing-disclosure-gate';
import { assertColoradoListingDisclosures } from './colorado-listing-disclosure-gate';

import type {
  CreateCounterofferData,
  CreateCounterofferResponse,
  OfferDocument,
  OfferInitiatingParty,
  OfferVersionDocument
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

            const reviseUnsigned = request.data.reviseUnsigned === true;
            if (reviseUnsigned) {
              verifyUnsignedRevisionAccess(offer, sourceVersion, userUid, sourceVersionUid);
            } else {
              verifyCounterofferAccess(offer, sourceVersion, userUid, sourceVersionUid);
            }
            let revisionDocuments: { documentVersions: Record<string,string>; requiredDisclosureTypes?: string[] } | undefined;
            if (reviseUnsigned) {
              const listingReference = adminFirestore.collection('listings').doc(offer.listingUid);
              const listingSnapshot = await transaction.get(listingReference);
              if (!listingSnapshot.exists) throw new HttpsError('not-found', 'The listing could not be found.');
              revisionDocuments = await (offer.stateCode === 'SC' ? readSouthCarolinaListingDisclosures : readCaliforniaListingDisclosures)(transaction, listingReference, listingSnapshot.data()!);
            }

            if (offer.stateCode === 'LA') {
              const listingReference = adminFirestore.collection('listings').doc(offer.listingUid);
              const listingSnapshot = await transaction.get(listingReference);
              if (!listingSnapshot.exists || !listingSnapshot.data()) {
                throw new HttpsError('not-found', 'The Louisiana listing could not be found.');
              }
              await assertLouisianaListingDisclosures(transaction, listingReference, listingSnapshot.data()!);
            }


if (offer.stateCode === 'CO') {
              const listingReference = adminFirestore.collection('listings').doc(offer.listingUid);
              const listingSnapshot = await transaction.get(listingReference);
              if (!listingSnapshot.exists || !listingSnapshot.data()) throw new HttpsError('not-found', 'The Colorado listing could not be found.');
              await assertColoradoListingDisclosures(transaction, listingReference, listingSnapshot.data()!);
            }

            const initiatingParty = reviseUnsigned
              ? sourceVersion.initiatedBy
              : getCounteringParty(sourceVersion.initiatedBy);

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

                terms: revisionDocuments ? {
                  ...createCounterofferTerms(sourceVersion.terms),
                  documentVersions: {
                    ...(sourceVersion.terms as unknown as {documentVersions: Readonly<Record<string,string>>}).documentVersions,
                    ...revisionDocuments.documentVersions
                  },
                  requiredDisclosureTypes: revisionDocuments.requiredDisclosureTypes ?? []
                } : createCounterofferTerms(sourceVersion.terms),

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
                      `${reviseUnsigned ? "Unsigned revision" : "Counteroffer"} Version ${nextVersionNumber} created from Version ${sourceVersion.versionNumber}.`,

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

            if (reviseUnsigned) {
              transaction.update(sourceVersionReference, {
                status: 'superseded', updatedAt: now,
                statusHistory: FieldValue.arrayUnion({
                  fromStatus: sourceVersion.status, toStatus: 'superseded',
                  action: 'superseded', actorUid: userUid, actorRole: initiatingParty,
                  note: 'Replaced by an editable unsigned revision; original terms and documents retained.',
                  occurredAt: now
                })
              });
            }
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
                ...(reviseUnsigned ? {} : {
                  lastDeliveredVersionUid: offer.lastDeliveredVersionUid ?? sourceVersionUid
                }),

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
                      `${reviseUnsigned ? "Unsigned revision" : "Counteroffer"} Version ${nextVersionNumber} draft created.`,

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


function verifyUnsignedRevisionAccess(
  offer: OfferDocument, version: OfferVersionDocument, userUid: string, versionUid: string
): void {
  if (!['CA','SC'].includes(offer.stateCode) || offer.currentVersionUid !== versionUid ||
      offer.status !== 'submitted' || version.status !== 'awaiting_signatures' ||
      !version.immutable || offer.lastDeliveredVersionUid === versionUid ||
      [...version.buyers, ...version.sellers].some(p => p.signature?.status === 'signed')) {
    throw new HttpsError('failed-precondition', 'Only the current unsigned, undelivered offer can return to editing.');
  }
  const initiators = version.initiatedBy === 'buyer' ? offer.buyerUids : offer.sellerUids;
  if (!initiators.includes(userUid)) {
    throw new HttpsError('permission-denied', 'Only the initiating party can revise this unsigned offer.');
  }
}

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


