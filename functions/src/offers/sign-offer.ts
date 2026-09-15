import {
  DocumentReference,
  FieldValue,
  Timestamp,
  Transaction,
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
  createOfferSignatureRecord,
} from './offer-signature.service';

import type {
  OfferSignatureRecord,
} from './offer-signature.service';

import type {
  OfferDocument,
  OfferVersionDocument,
  OfferVersionPartySnapshotDocument,
} from './offer-types';


interface SignOfferData {
  offerUid: string;
  offerVersionUid: string;
  documentUid: string;

  typedSignature: string;

  consentToElectronicRecords: boolean;
  consentToElectronicSignature: boolean;
  certificationAccepted: boolean;
}


interface SignOfferResponse {
  offerUid: string;
  offerVersionUid: string;
  documentUid: string;
  signatureUid: string;

  fullyExecuted: boolean;
  alreadySigned: boolean;

  contractUid?: string;
}


interface GeneratedOfferDocument {
  Uid?: string;
  offerUid?: string;
  offerVersionUid?: string;
  type?: string;

  hash?: {
    algorithm?: string;
    value?: string;
  };

  signatureRequest?: {
    status?: string;
    signers?: GeneratedOfferDocumentSigner[];
    completedAt?: Timestamp;
  };
}


interface GeneratedOfferDocumentSigner {
  partyUid?: string;
  userUid?: string;
  role?: string;
  legalName?: string;
  email?: string;
  required?: boolean;
  status?: string;
  signedAt?: Timestamp;
  signatureUid?: string;
}


const SIGNABLE_VERSION_STATUSES =
  new Set([
    'awaiting_signatures',
    'partially_signed',
    'signed',
    'delivered',
    'accepted',
  ]);


const SIGNABLE_DOCUMENT_TYPES =
  new Set([
    'offer_agreement',
    'counteroffer_agreement',
  ]);


/*
 * Signs one immutable offer or counteroffer PDF.
 *
 * The party who created the version signs first. Once every
 * required signer on that side has signed, the version is
 * delivered to the receiving party. The receiving party's
 * final required signature makes the contract effective.
 */
export const signOffer =
  onCall<
    SignOfferData,
    Promise<SignOfferResponse>
  >(
    callableFunctionOptions,
    async request => {
      const userUid =
        request.auth?.uid;

      if (!userUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must sign in before signing an offer.'
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

      const documentUid =
        requireIdentifier(
          request.data?.documentUid,
          'documentUid'
        );

      const typedSignature =
        requireSignatureText(
          request.data?.typedSignature
        );

      const offerReference =
        adminFirestore
          .collection('offers')
          .doc(offerUid);

      const versionReference =
        offerReference
          .collection('versions')
          .doc(offerVersionUid);

      const documentReference =
        offerReference
          .collection('documents')
          .doc(documentUid);

      return adminFirestore.runTransaction(
        async transaction => {
          const [
            offerSnapshot,
            versionSnapshot,
            documentSnapshot,
          ] = await Promise.all([
            transaction.get(
              offerReference
            ),

            transaction.get(
              versionReference
            ),

            transaction.get(
              documentReference
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

          if (!documentSnapshot.exists) {
            throw new HttpsError(
              'failed-precondition',
              'Generate the agreement PDF before signing.'
            );
          }

          const offer =
            offerSnapshot.data() as
              OfferDocument;

          const version =
            versionSnapshot.data() as
              OfferVersionDocument;

          const document =
            documentSnapshot.data() as
              GeneratedOfferDocument;

          verifySignableVersion(
            offer,
            version,
            offerVersionUid
          );

          verifySignableDocument(
            document,
            offerUid,
            offerVersionUid
          );

          const signer =
            findSigner(
              version,
              userUid
            );

          verifySigningOrder(
            version,
            signer
          );

          const signatureReference =
            documentReference
              .collection('signatures')
              .doc(signer.partyUid);

          const signatureSnapshot =
            await transaction.get(
              signatureReference
            );

          if (signatureSnapshot.exists) {
            const storedSignature =
              signatureSnapshot.data();

            return {
              offerUid,
              offerVersionUid,
              documentUid,

              signatureUid:
                readRequiredString(
                  storedSignature,
                  'Uid'
                ),

              fullyExecuted:
                version.status ===
                'accepted',

              alreadySigned: true,

              ...(
                offer.contract?.contractUid
                  ? {
                    contractUid:
                      offer.contract
                        .contractUid,
                  }
                  : {}
              ),
            };
          }

          const now =
            Timestamp.now();

          const updatedBuyers =
            applyPartySignature(
              version.buyers,
              signer.partyUid,
              now
            );

          const updatedSellers =
            applyPartySignature(
              version.sellers,
              signer.partyUid,
              now
            );

          const initiatingParties =
            version.initiatedBy ===
              'buyer'
              ? updatedBuyers
              : updatedSellers;

          const receivingParties =
            version.initiatedBy ===
              'buyer'
              ? updatedSellers
              : updatedBuyers;

          const initiatingSideSigned =
            allRequiredPartiesSigned(
              initiatingParties
            );

          const receivingSideSigned =
            allRequiredPartiesSigned(
              receivingParties
            );

          const fullyExecuted =
            initiatingSideSigned &&
            receivingSideSigned;

          const versionDeliveredNow =
            initiatingSideSigned &&
            !version.deliveredAt;

          const shouldIncrementPendingOfferCount =
            versionDeliveredNow &&
            offer.pendingOfferCounted !== true;

          const deliveredOfferStatus =
            version.versionNumber === 1
              ? 'submitted'
              : 'countered';

          const signerRole =
            signer.role;

          const nextVersionStatus =
            fullyExecuted
              ? 'accepted'
              : initiatingSideSigned
                ? 'delivered'
                : 'partially_signed';

          const nextSignatureRequestStatus =
            fullyExecuted
              ? 'completed'
              : initiatingSideSigned
                ? 'awaiting_signatures'
                : 'partially_signed';

          const updatedDocumentSigners =
            applyDocumentSignerSignature(
              document.signatureRequest
                ?.signers ?? [],
              signer.partyUid,
              signer.userUid,
              now
            );

          const signatureUid =
            signer.partyUid;

          let signatureRecord:
            OfferSignatureRecord;

          try {
            signatureRecord =
              createOfferSignatureRecord({
                signatureUid,

                signerUid: userUid,
                signerRole,

                legalFirstName:
                  signer
                    .identityVerification
                    .verifiedFirstName ??
                  signer.firstName,

                legalMiddleName:
                  signer
                    .identityVerification
                    .verifiedMiddleName ??
                  signer.middleName,

                legalLastName:
                  signer
                    .identityVerification
                    .verifiedLastName ??
                  signer.lastName,

                legalSuffix:
                  signer.suffix,

                typedSignature,

                offerUid,
                offerVersionUid,
                documentUid,

                documentHash:
                  requireDocumentHash(
                    document
                  ),

                signatureMethod:
                  'typed_name',

                consentToElectronicRecords:
                  request.data
                    ?.consentToElectronicRecords ===
                  true,

                consentToElectronicSignature:
                  request.data
                    ?.consentToElectronicSignature ===
                  true,

                certificationAccepted:
                  request.data
                    ?.certificationAccepted ===
                  true,

                signedFromIpAddress:
                  readRequestIpAddress(
                    request.rawRequest
                  ),

                signedFromUserAgent:
                  request.rawRequest.get(
                    'user-agent'
                  ),

                identityVerificationUid:
                  signer
                    .identityVerification
                    .providerVerificationUid,

                identityVerificationProvider:
                  signer
                    .identityVerification
                    .provider,

                identityVerifiedAt:
                  signer
                    .identityVerification
                    .verifiedAt,
              });
          } catch (error) {
            throw new HttpsError(
              'failed-precondition',
              getErrorMessage(error)
            );
          }

          let competingOffers:
            Array<{
              offerUid: string;
              offerReference:
                DocumentReference;
              offer: OfferDocument;
              versionReference?:
                DocumentReference;
              version?: OfferVersionDocument;
            }> = [];

          const listingReference =
            adminFirestore
              .collection('listings')
              .doc(offer.listingUid);

          let contractReference:
            DocumentReference |
            undefined;

          const contractUid =
            offerUid;

          if (fullyExecuted) {
            contractReference =
              adminFirestore
                .collection('contracts')
                .doc(contractUid);

            const competingOffersQuery =
              adminFirestore
                .collection('offers')
                .where(
                  'listingUid',
                  '==',
                  offer.listingUid
                );

            const [
              listingSnapshot,
              contractSnapshot,
              competingOffersSnapshot,
            ] = await Promise.all([
              transaction.get(
                listingReference
              ),

              transaction.get(
                contractReference
              ),

              transaction.get(
                competingOffersQuery
              ),
            ]);

            if (!listingSnapshot.exists) {
              throw new HttpsError(
                'not-found',
                'The property listing could not be found.'
              );
            }

            if (
              contractSnapshot.exists &&
              offer.contract?.contractUid !==
                contractUid
            ) {
              throw new HttpsError(
                'already-exists',
                'A contract already exists for this offer.'
              );
            }

            competingOffers =
              competingOffersSnapshot.docs
                .filter(
                  snapshot =>
                    snapshot.id !== offerUid
                )
                .map(snapshot => ({
                  offerUid: snapshot.id,
                  offerReference:
                    snapshot.ref,
                  offer:
                    snapshot.data() as
                      OfferDocument,
                }))
                .filter(
                  candidate =>
                    candidate.offer
                      .pendingOfferCounted ===
                    true
                );

            const competingVersionSnapshots =
              await Promise.all(
                competingOffers.map(
                  candidate => {
                    const competingVersionReference =
                      candidate
                        .offerReference
                        .collection('versions')
                        .doc(
                          candidate.offer
                            .currentVersionUid
                        );

                    candidate.versionReference =
                      competingVersionReference;

                    return transaction.get(
                      competingVersionReference
                    );
                  }
                )
              );

            competingVersionSnapshots
              .forEach(
                (
                  snapshot,
                  index
                ) => {
                  if (snapshot.exists) {
                    competingOffers[index]
                      .version =
                        snapshot.data() as
                          OfferVersionDocument;
                  }
                }
              );
          }

          transaction.create(
            signatureReference,
            signatureRecord
          );

          transaction.update(
            documentReference,
            {
              signatureRequest: {
                ...document.signatureRequest,

                status:
                  nextSignatureRequestStatus,

                signers:
                  updatedDocumentSigners,

                ...(
                  fullyExecuted
                    ? {
                      completedAt: now,
                    }
                    : {}
                ),
              },

              updatedAt: now,
            }
          );

          transaction.update(
            versionReference,
            {
              buyers: updatedBuyers,
              sellers: updatedSellers,

              documents:
                updateVersionDocumentSummary(
                  version.documents,
                  documentUid,
                  nextSignatureRequestStatus,
                  fullyExecuted,
                  now
                ),

              status:
                nextVersionStatus,

              ...(
                fullyExecuted
                  ? {
                    fullySignedAt: now,
                    acceptedAt: now,
                  }
                  : versionDeliveredNow
                    ? {
                      deliveredAt: now,
                      submittedAt:
                        version.submittedAt ??
                        now,
                    }
                    : {}
              ),

              statusHistory:
                FieldValue.arrayUnion({
                  fromStatus:
                    version.status,

                  toStatus:
                    nextVersionStatus,

                  action:
                    fullyExecuted
                      ? 'accepted'
                      : initiatingSideSigned
                        ? 'delivered'
                        : 'partially_signed',

                  actorUid: userUid,
                  actorRole: signerRole,

                  note:
                    fullyExecuted
                      ? 'The final required party signed and the agreement became effective.'
                      : initiatingSideSigned
                        ? 'The initiating party completed signing and the offer version was delivered.'
                        : 'A required party signed the agreement.',

                  occurredAt: now,
                }),

              updatedAt: now,
            }
          );

          if (fullyExecuted) {
            const dueDiligenceEndsAt =
              resolveDueDiligenceEndDate(
                version,
                now
              );

            const anticipatedClosingDate =
              version.terms
                .settlement
                .settlementDate;

            const contract = {
              contractUid,

              acceptedOfferVersionUid:
                offerVersionUid,

              acceptedOfferVersionNumber:
                version.versionNumber,

              status: 'effective',
              transactionPhase:
                'due_diligence',

              effectiveAt: now,
              dueDiligenceEndsAt,
              anticipatedClosingDate,
            };

            transaction.update(
              offerReference,
              {
                status:
                  'converted_to_contract',

                pendingOfferCounted:
                  false,

                contract,

                closedReason:
                  'converted_to_contract',

                closedAt: now,
                lastActivityAt: now,
                updatedAt: now,

                statusHistory:
                  FieldValue.arrayUnion({
                    fromStatus:
                      offer.status,

                    toStatus:
                      'converted_to_contract',

                    action:
                      'converted_to_contract',

                    actorUid: userUid,
                    actorRole: signerRole,

                    offerVersionUid,
                    offerVersionNumber:
                      version.versionNumber,

                    note:
                      'The final required party signed the accepted agreement.',

                    occurredAt: now,
                  }),
              }
            );

            transaction.set(
              contractReference!,
              {
                Uid: contractUid,

                offerUid,
                offerVersionUid,
                offerVersionNumber:
                  version.versionNumber,

                listingUid:
                  offer.listingUid,

                referenceNumber:
                  offer.referenceNumber,

                buyerUids:
                  offer.buyerUids,

                sellerUids:
                  offer.sellerUids,

                status: 'effective',
                transactionPhase:
                  'due_diligence',

                effectiveAt: now,
                dueDiligenceEndsAt,
                anticipatedClosingDate,

                createdAt: now,
                updatedAt: now,
              },
              {
                merge: true,
              }
            );

            transaction.update(
              listingReference,
              {
                status:
                  'under_contract',

                acceptingOffers:
                  false,

                pendingOfferCount:
                  0,

                activeContractUid:
                  contractUid,

                underContractAt: now,
                updatedAt: now,
              }
            );

            closeCompetingOffers(
              transaction,
              competingOffers,
              offer,
              version,
              now
            );

            notifyFullyExecuted(
              transaction,
              offer,
              version,
              userUid
            );
          } else {
            transaction.update(
              offerReference,
              {
                ...(
                  versionDeliveredNow
                    ? {
                      status:
                        deliveredOfferStatus,

                      lastDeliveredVersionUid:
                        offerVersionUid,

                      pendingOfferCounted:
                        true,

                      submittedAt:
                        offer.submittedAt ??
                        now,

                      statusHistory:
                        FieldValue.arrayUnion({
                          fromStatus:
                            offer.status,

                          toStatus:
                            deliveredOfferStatus,

                          action:
                            version.versionNumber ===
                              1
                              ? 'submitted'
                              : 'countered',

                          actorUid: userUid,
                          actorRole: signerRole,

                          offerVersionUid,
                          offerVersionNumber:
                            version.versionNumber,

                          occurredAt: now,
                        }),
                    }
                    : {}
                ),

                lastActivityAt: now,
                updatedAt: now,
              }
            );

            if (
              shouldIncrementPendingOfferCount
            ) {
              transaction.update(
                listingReference,
                {
                  pendingOfferCount:
                    FieldValue.increment(1),

                  updatedAt: now,
                }
              );
            }

            if (versionDeliveredNow) {
              notifySignatureProgress(
                transaction,
                offer,
                version,
                signer,
                true
              );
            }
          }

          return {
            offerUid,
            offerVersionUid,
            documentUid,
            signatureUid,

            fullyExecuted,
            alreadySigned: false,

            ...(
              fullyExecuted
                ? {
                  contractUid,
                }
                : {}
            ),
          };
        }
      );
    }
  );


function verifySignableVersion(
  offer: OfferDocument,
  version: OfferVersionDocument,
  offerVersionUid: string
): void {
  if (
    offer.currentVersionUid !==
    offerVersionUid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This is no longer the current offer version.'
    );
  }

  if (
    version.offerUid !== offer.Uid ||
    version.Uid !== offerVersionUid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The offer version does not belong to this offer.'
    );
  }

  if (
    !version.immutable ||
    !SIGNABLE_VERSION_STATUSES.has(
      version.status
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer version is not available for signing.'
    );
  }
}


function verifySignableDocument(
  document: GeneratedOfferDocument,
  offerUid: string,
  offerVersionUid: string
): void {
  if (
    document.offerUid !== offerUid ||
    document.offerVersionUid !==
      offerVersionUid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The document does not belong to this offer version.'
    );
  }

  if (
    !document.type ||
    !SIGNABLE_DOCUMENT_TYPES.has(
      document.type
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This document is not an offer agreement that can be signed.'
    );
  }

  requireDocumentHash(document);
}


function findSigner(
  version: OfferVersionDocument,
  userUid: string
): OfferVersionPartySnapshotDocument {
  const signer = [
    ...version.buyers,
    ...version.sellers,
  ].find(
    party =>
      party.userUid === userUid &&
      party.requiredSigner
  );

  if (!signer) {
    throw new HttpsError(
      'permission-denied',
      'You are not a required signer on this offer version.'
    );
  }

  if (
    signer.identityVerification
      .status !== 'verified' ||
    !signer.identityVerification
      .legalNameApplied
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Identity verification must be completed before signing.'
    );
  }

  return signer;
}


function verifySigningOrder(
  version: OfferVersionDocument,
  signer: OfferVersionPartySnapshotDocument
): void {
  if (
    signer.signature.status ===
    'signed'
  ) {
    return;
  }

  if (
    signer.role === version.initiatedBy
  ) {
    return;
  }

  const initiatingParties =
    version.initiatedBy === 'buyer'
      ? version.buyers
      : version.sellers;

  if (
    !allRequiredPartiesSigned(
      initiatingParties
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The party sending this offer must finish signing before the receiving party can sign.'
    );
  }
}


function applyPartySignature(
  parties:
    OfferVersionPartySnapshotDocument[],
  partyUid: string,
  signedAt: Timestamp
): OfferVersionPartySnapshotDocument[] {
  return parties.map(
    party =>
      party.partyUid === partyUid
        ? {
          ...party,

          signature: {
            ...party.signature,
            status: 'signed',
            signedAt,
          },

          electronicTransactionsConsentAccepted:
            true,

          electronicTransactionsConsentAcceptedAt:
            signedAt,
        }
        : party
  );
}


function applyDocumentSignerSignature(
  signers: GeneratedOfferDocumentSigner[],
  partyUid: string,
  userUid: string | undefined,
  signedAt: Timestamp
): GeneratedOfferDocumentSigner[] {
  return signers.map(
    signer =>
      signer.partyUid === partyUid ||
      (
        userUid &&
        signer.userUid === userUid
      )
        ? {
          ...signer,
          status: 'signed',
          signedAt,
          signatureUid: partyUid,
        }
        : signer
  );
}


function allRequiredPartiesSigned(
  parties:
    OfferVersionPartySnapshotDocument[]
): boolean {
  const requiredParties =
    parties.filter(
      party =>
        party.requiredSigner
    );

  return (
    requiredParties.length > 0 &&
    requiredParties.every(
      party =>
        party.signature.status ===
        'signed'
    )
  );
}


function updateVersionDocumentSummary(
  documents: Record<string, unknown>[],
  documentUid: string,
  signatureRequestStatus: string,
  fullySigned: boolean,
  signedAt: Timestamp
): Record<string, unknown>[] {
  return documents.map(
    document =>
      document['documentUid'] ===
        documentUid
        ? {
          ...document,
          signatureRequestStatus,
          fullySigned,
          ...(
            fullySigned
              ? {
                signedAt,
              }
              : {}
          ),
        }
        : document
  );
}


function notifySignatureProgress(
  transaction:
    Transaction,
  offer: OfferDocument,
  version: OfferVersionDocument,
  signer: OfferVersionPartySnapshotDocument,
  delivered: boolean
): void {
  const recipientUids =
    signer.role === 'buyer'
      ? offer.sellerUids
      : offer.buyerUids;

  const propertyAddress =
    formatPropertyAddress(offer);

  for (
    const recipientUid of
      uniqueStrings(recipientUids)
  ) {
    addOfferNotificationToTransaction(
      transaction,
      adminFirestore,
      {
        recipientUid,
        actorUid:
          signer.userUid,

        offerUid:
          offer.Uid,

        offerVersionUid:
          version.Uid,

        listingUid:
          offer.listingUid,

        type:
          delivered
            ? 'signature_requested'
            : signer.role === 'buyer'
              ? 'buyer_signed'
              : 'seller_signed',

        title:
          delivered
            ? `Offer ${offer.referenceNumber}-${version.versionNumber} is ready for your response`
            : `${signer.legalName} signed the agreement`,

       
       message:
  delivered
    ? version.versionNumber === 1
      ? `${signer.legalName} has sent a signed offer. Review it; you can accept and sign, counteroffer, or decline.`
      : `${signer.legalName} has sent a signed counteroffer. Review the revised terms; you can accept and sign, counteroffer, or decline.`
    : `${signer.legalName} completed a required signature.`,

        propertyAddress,

        channels: [
          'in_app',
          'email',
        ],

        eventKey:
          `${signer.partyUid}-signed`,

        metadata: {
          referenceNumber:
            offer.referenceNumber,

          versionNumber:
            version.versionNumber,

          fromPartyRole:
            signer.role,

          fromPartyName:
            signer.legalName,
        },
      }
    );
  }
}


function notifyFullyExecuted(
  transaction:
    Transaction,
  offer: OfferDocument,
  version: OfferVersionDocument,
  actorUid: string
): void {
  const propertyAddress =
    formatPropertyAddress(offer);

  for (
    const recipientUid of
      uniqueStrings([
        ...offer.buyerUids,
        ...offer.sellerUids,
      ])
  ) {
    addOfferNotificationToTransaction(
      transaction,
      adminFirestore,
      {
        recipientUid,
        actorUid,

        offerUid:
          offer.Uid,

        offerVersionUid:
          version.Uid,

        listingUid:
          offer.listingUid,

        type:
          'offer_fully_executed',

        title:
          'Residential Purchase and Sale Agreement executed',

        message:
          `All required parties signed Offer ${offer.referenceNumber}-${version.versionNumber}. The property is now under contract.`,

        propertyAddress,

        channels: [
          'in_app',
          'email',
        ],

        eventKey:
          'fully-executed',

        metadata: {
          referenceNumber:
            offer.referenceNumber,

          versionNumber:
            version.versionNumber,
        },
      }
    );
  }
}


function closeCompetingOffers(
  transaction:
    Transaction,
  competingOffers: Array<{
    offerUid: string;
    offerReference:
      DocumentReference;
    offer: OfferDocument;
    versionReference?:
      DocumentReference;
    version?: OfferVersionDocument;
  }>,
  acceptedOffer: OfferDocument,
  acceptedVersion: OfferVersionDocument,
  now: Timestamp
): void {
  const propertyAddress =
    formatPropertyAddress(
      acceptedOffer
    );

  for (
    const competing of
      competingOffers
  ) {
    transaction.update(
      competing.offerReference,
      {
        status:
          'closed_due_to_contract',

        pendingOfferCounted:
          false,

        closedReason:
          'property_under_contract',

        closedAt: now,
        lastActivityAt: now,
        updatedAt: now,

        statusHistory:
          FieldValue.arrayUnion({
            fromStatus:
              competing.offer.status,

            toStatus:
              'closed_due_to_contract',

            action:
              'closed_due_to_contract',

            actorUid: 'system',
            actorRole: 'system',

            offerVersionUid:
              competing.offer
                .currentVersionUid,

            offerVersionNumber:
              competing.offer
                .currentVersionNumber,

            note:
              'Another offer on this property became an effective contract.',

            occurredAt: now,
          }),
      }
    );

    if (
      competing.versionReference &&
      competing.version &&
      competing.version.status !==
        'accepted'
    ) {
      transaction.update(
        competing.versionReference,
        {
          status: 'superseded',
          supersededAt: now,
          updatedAt: now,

          statusHistory:
            FieldValue.arrayUnion({
              fromStatus:
                competing.version.status,

              toStatus: 'superseded',
              action: 'superseded',

              actorUid: 'system',
              actorRole: 'system',

              note:
                'Closed because another offer became an effective contract.',

              occurredAt: now,
            }),
        }
      );
    }

    for (
      const recipientUid of
        uniqueStrings(
          competing.offer.buyerUids
        )
    ) {
      addOfferNotificationToTransaction(
        transaction,
        adminFirestore,
        {
          recipientUid,

          offerUid:
            competing.offerUid,

          offerVersionUid:
            competing.offer
              .currentVersionUid,

          listingUid:
            competing.offer.listingUid,

          type:
            'offer_closed_due_to_contract',

          title:
            'Property is under contract',

          message:
            `Your offer was closed because another offer on ${propertyAddress} became an effective contract.`,

          propertyAddress,

          channels: [
            'in_app',
            'email',
          ],

          eventKey:
            `closed-by-${acceptedOffer.Uid}-${acceptedVersion.Uid}`,

          metadata: {
            referenceNumber:
              competing.offer
                .referenceNumber,

            acceptedOfferUid:
              acceptedOffer.Uid,
          },
        }
      );
    }
  }
}


function resolveDueDiligenceEndDate(
  version: OfferVersionDocument,
  effectiveAt: Timestamp
): string | undefined {
  const deposits =
    version.terms.deposits;

  if (
    deposits.dueDiligenceDeadlineType ===
    'specific_date'
  ) {
    return deposits.dueDiligenceEndDate;
  }

  if (
    deposits.dueDiligenceDeadlineType ===
      'days_after_effective_date' &&
    typeof deposits
      .dueDiligenceDaysAfterEffectiveDate ===
      'number'
  ) {
    const date =
      effectiveAt.toDate();

    date.setUTCDate(
      date.getUTCDate() +
      deposits
        .dueDiligenceDaysAfterEffectiveDate
    );

    return date
      .toISOString()
      .slice(0, 10);
  }

  return undefined;
}


function requireDocumentHash(
  document: GeneratedOfferDocument
): string {
  const algorithm =
    document.hash?.algorithm
      ?.trim()
      .toUpperCase();

  const value =
    document.hash?.value
      ?.trim()
      .toLowerCase();

  if (
    algorithm !== 'SHA-256' ||
    !value ||
    !/^[a-f0-9]{64}$/.test(value)
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The agreement PDF does not have a valid SHA-256 document hash.'
    );
  }

  return value;
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


function readRequestIpAddress(
  request:
    {
      ip?: string;
      get(name: string):
        string | undefined;
    }
): string | null {
  if (
    'ip' in request &&
    typeof request.ip === 'string' &&
    request.ip.trim()
  ) {
    return request.ip.trim();
  }

  const forwardedFor =
    request.get(
      'x-forwarded-for'
    );

  return forwardedFor
    ?.split(',')[0]
    ?.trim() || null;
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


function readRequiredString(
  value: unknown,
  fieldName: string
): string {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    throw new HttpsError(
      'data-loss',
      `The stored signature is missing ${fieldName}.`
    );
  }

  const fieldValue =
    (
      value as
        Record<string, unknown>
    )[fieldName];

  if (
    typeof fieldValue !== 'string' ||
    !fieldValue.trim()
  ) {
    throw new HttpsError(
      'data-loss',
      `The stored signature is missing ${fieldName}.`
    );
  }

  return fieldValue.trim();
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


function requireSignatureText(
  value: unknown
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Your typed legal signature is required.'
    );
  }

  const normalized =
    value.trim();

  if (normalized.length > 200) {
    throw new HttpsError(
      'invalid-argument',
      'The typed signature is too long.'
    );
  }

  return normalized;
}


function getErrorMessage(
  error: unknown
): string {
  return error instanceof Error
    ? error.message
    : 'The signature could not be completed.';
}
