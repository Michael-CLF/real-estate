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

import type {
  OfferDocument,
  OfferTermsDocument,
  OfferVersionDocument,
  OfferVersionPartySnapshotDocument,
  SaveOfferDraftData,
  SaveOfferDraftResponse,
} from './offer-types';


const MAX_SAVE_PAYLOAD_BYTES =
  750_000;


/*
 * Saves editable fields on the current draft version.
 *
 * Submitted, signed, superseded or otherwise immutable
 * versions can never be changed.
 */
export const saveOfferDraft =
  onCall<
    SaveOfferDraftData,
    Promise<SaveOfferDraftResponse>
  >(
    callableFunctionOptions,
    async request => {
      const userUid =
        request.auth?.uid;

      if (!userUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must sign in before saving an offer.'
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

      const requestedChanges =
        requireChanges(
          request.data?.changes
        );

      validatePayloadSize(
        requestedChanges
      );

      const offerReference =
        adminFirestore
          .collection('offers')
          .doc(offerUid);

      const versionReference =
        offerReference
          .collection('versions')
          .doc(offerVersionUid);

      await adminFirestore.runTransaction(
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

          verifyDraftOwnership(
            offer,
            version,
            userUid,
            offerVersionUid
          );

          const sanitizedChanges =
            sanitizeDraftChanges(
              requestedChanges,
              version,
              userUid
            );

          if (
            Object.keys(
              sanitizedChanges
            ).length === 0
          ) {
            return;
          }

          const now =
            Timestamp.now();

          transaction.update(
            versionReference,
            {
              ...sanitizedChanges,

              updatedAt: now,

              statusHistory:
                FieldValue.arrayUnion({
                  fromStatus: 'draft',
                  toStatus: 'draft',

                  action: 'saved',

                  actorUid: userUid,

                  actorRole:
                    version.initiatedBy,

                  occurredAt: now,
                }),
            }
          );

          transaction.update(
            offerReference,
            {
              lastActivityAt: now,
              updatedAt: now,

              statusHistory:
                FieldValue.arrayUnion({
                  fromStatus: 'draft',
                  toStatus: 'draft',

                  action: 'draft_saved',

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
        }
      );

      return {
        success: true,
      };
    }
  );


function verifyDraftOwnership(
  offer: OfferDocument,
  version: OfferVersionDocument,
  userUid: string,
  requestedVersionUid: string
): void {
  if (
    offer.currentVersionUid !==
    requestedVersionUid
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This is no longer the current offer version. Refresh the offer before continuing.'
    );
  }

  if (
    offer.status !== 'draft' &&
    offer.status !== 'countered'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer is not editable.'
    );
  }

  if (
    version.status !== 'draft' ||
    version.immutable
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This offer version is no longer editable.'
    );
  }

  if (
    version.initiatedByUid !== userUid
  ) {
    throw new HttpsError(
      'permission-denied',
      'Only the party who created this draft may edit it.'
    );
  }

  const authorizedParticipant =
    version.initiatedBy === 'buyer'
      ? offer.buyerUids.includes(
        userUid
      )
      : offer.sellerUids.includes(
        userUid
      );

  if (!authorizedParticipant) {
    throw new HttpsError(
      'permission-denied',
      'You do not have permission to edit this offer.'
    );
  }
}


function sanitizeDraftChanges(
  changes: Record<string, unknown>,
  currentVersion: OfferVersionDocument,
  userUid: string
): Record<string, unknown> {
  const sanitized:
    Record<string, unknown> = {};

  if (
    Object.prototype.hasOwnProperty.call(
      changes,
      'terms'
    )
  ) {
    sanitized['terms'] =
      sanitizeTerms(
        changes['terms'],
        currentVersion.terms,
        currentVersion.initiatedBy
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      changes,
      'wizardData'
    )
  ) {
    sanitized['wizardData'] =
      sanitizeWizardData(
        changes['wizardData']
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      changes,
      'expiresAt'
    )
  ) {
    sanitized['expiresAt'] =
      sanitizeExpiresAt(
        changes['expiresAt']
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      changes,
      'buyers'
    )
  ) {
    if (
      currentVersion.initiatedBy !==
      'buyer'
    ) {
      throw new HttpsError(
        'permission-denied',
        'A seller cannot modify buyer identity information.'
      );
    }

    sanitized['buyers'] =
      sanitizeInitiatingParty(
        changes['buyers'],
        currentVersion.buyers,
        userUid,
        'buyer'
      );
  }

  if (
    Object.prototype.hasOwnProperty.call(
      changes,
      'sellers'
    )
  ) {
    if (
      currentVersion.initiatedBy !==
      'seller'
    ) {
      throw new HttpsError(
        'permission-denied',
        'A buyer cannot modify seller identity information.'
      );
    }

    sanitized['sellers'] =
      sanitizeInitiatingParty(
        changes['sellers'],
        currentVersion.sellers,
        userUid,
        'seller'
      );
  }

  return removeUndefinedValues(
    sanitized
  );
}


function sanitizeTerms(
  requestedTerms: unknown,
  currentTerms: OfferTermsDocument,
  initiatedBy: 'buyer' | 'seller'
): OfferTermsDocument {
  if (
    requestedTerms === null ||
    typeof requestedTerms !== 'object' ||
    Array.isArray(requestedTerms)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Offer terms must be an object.'
    );
  }

  const terms =
    structuredCloneSafe(
      requestedTerms as
      Record<string, unknown>
    );

  /*
   * The property and contract state are trusted backend
   * snapshots. A browser may never replace them.
   */
  terms['stateCode'] =
    currentTerms.stateCode;

  terms['property'] =
    currentTerms.property;

  const requestedDeposits =
    requireObject(
      terms['deposits'],
      'Deposit terms must be an object.'
    );

  /*
   * These values come directly from the attorney-approved
   * agreement and are not editable browser fields.
   */
  requestedDeposits[
    'depositDeliveryDays'
  ] = 4;

  requestedDeposits[
    'dueDiligenceEndTime'
  ] = '17:00';

  const requestedDelivery =
    requireObject(
      terms['delivery'],
      'Delivery terms must be an object.'
    );

  /*
   * Party delivery addresses are populated from the
   * NavStreet account snapshots and cannot be replaced by
   * the browser.
   */
  requestedDelivery[
    'buyerDeliveryEmail'
  ] = currentTerms
    .delivery
    .buyerDeliveryEmail;

  requestedDelivery[
    'sellerDeliveryEmail'
  ] = currentTerms
    .delivery
    .sellerDeliveryEmail;

  requestedDelivery['timeZone'] =
    'America/New_York';

  if (initiatedBy === 'buyer') {
    /*
     * A buyer cannot answer or overwrite the seller's
     * Section 6 statements.
     */
    terms['sellerStatements'] =
      currentTerms.sellerStatements;
  } else {
    /*
     * A seller cannot rewrite disclosure selections that
     * the buyer previously made and acknowledged.
     */
    terms['buyerDisclosures'] =
      currentTerms.buyerDisclosures;
  }

  rejectUnsafeObjectKeys(
    terms
  );

  return removeUndefinedValues(
    terms
  ) as unknown as OfferTermsDocument;
}

function sanitizeWizardData(
  requestedWizardData: unknown
): Record<string, unknown> {
  if (
    requestedWizardData === null ||
    typeof requestedWizardData !==
    'object' ||
    Array.isArray(requestedWizardData)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Offer wizard data must be an object.'
    );
  }

  const wizardData =
    structuredCloneSafe(
      requestedWizardData as
      Record<string, unknown>
    );

  rejectUnsafeObjectKeys(
    wizardData
  );

  return removeUndefinedValues(
    wizardData
  );
}


function sanitizeExpiresAt(
  value: unknown
): string {
  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'Offer expiration must be a date-and-time string.'
    );
  }

  const normalizedValue =
    value.trim();

  /*
   * Empty expiration is allowed while the record remains a
   * draft. Submission validation will require a future
   * date and time with an explicit UTC offset.
   */
  if (normalizedValue.length === 0) {
    return '';
  }

  if (
    normalizedValue.length > 100 ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(
      normalizedValue
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Offer expiration must include a valid UTC offset.'
    );
  }

  const parsedDate =
    new Date(normalizedValue);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Offer expiration is invalid.'
    );
  }

  return normalizedValue;
}


function sanitizeInitiatingParty(
  requestedParties: unknown,
  existingParties:
    OfferVersionPartySnapshotDocument[],
  userUid: string,
  expectedRole: 'buyer' | 'seller'
): OfferVersionPartySnapshotDocument[] {
  if (!Array.isArray(requestedParties)) {
    throw new HttpsError(
      'invalid-argument',
      'Offer parties must be an array.'
    );
  }

  /*
   * The MVP supports one buyer and one seller. Party names,
   * email addresses and signature identities come from the
   * trusted Firebase snapshots and are not browser-editable.
   */
  if (
    requestedParties.length !==
    existingParties.length
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Offer parties cannot be added or removed through draft autosave.'
    );
  }

  if (
    !existingParties.some(
      party =>
        party.userUid === userUid &&
        party.role === expectedRole
    )
  ) {
    throw new HttpsError(
      'permission-denied',
      'The authenticated offer party could not be verified.'
    );
  }

  for (
    const existingParty of
    existingParties
  ) {
    if (
      existingParty.role !==
      expectedRole
    ) {
      throw new HttpsError(
        'failed-precondition',
        'The offer party role is invalid.'
      );
    }

    const requestedParty =
      requestedParties.find(
        party => {
          if (
            party === null ||
            typeof party !== 'object'
          ) {
            return false;
          }

          return (
            party as
              Record<string, unknown>
          )['partyUid'] ===
            existingParty.partyUid;
        }
      );

    if (!requestedParty) {
      throw new HttpsError(
        'invalid-argument',
        'An existing offer party is missing from the save request.'
      );
    }
  }

  return existingParties;
}


function requireChanges(
  value: unknown
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Offer changes must be an object.'
    );
  }

  const changes =
    value as Record<string, unknown>;

  rejectUnsafeObjectKeys(
    changes
  );

  const allowedKeys =
    new Set([
      'terms',
      'wizardData',
      'buyers',
      'sellers',
      'expiresAt',
    ]);

  for (
    const key of
    Object.keys(changes)
  ) {
    if (!allowedKeys.has(key)) {
      throw new HttpsError(
        'invalid-argument',
        `${key} cannot be changed through draft autosave.`
      );
    }
  }

  return changes;
}


function requireObject(
  value: unknown,
  message: string
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new HttpsError(
      'invalid-argument',
      message
    );
  }

  return value as
    Record<string, unknown>;
}


function validatePayloadSize(
  value: Record<string, unknown>
): void {
  let serializedValue: string;

  try {
    serializedValue =
      JSON.stringify(value);
  } catch {
    throw new HttpsError(
      'invalid-argument',
      'The offer changes could not be processed.'
    );
  }

  const payloadBytes =
    Buffer.byteLength(
      serializedValue,
      'utf8'
    );

  if (
    payloadBytes >
    MAX_SAVE_PAYLOAD_BYTES
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The offer changes are too large.'
    );
  }
}


function rejectUnsafeObjectKeys(
  value: Record<string, unknown>
): void {
  const unsafeKeys =
    new Set([
      '__proto__',
      'prototype',
      'constructor',
    ]);

  const inspect =
    (nestedValue: unknown): void => {
      if (Array.isArray(nestedValue)) {
        nestedValue.forEach(inspect);
        return;
      }

      if (
        nestedValue === null ||
        typeof nestedValue !== 'object'
      ) {
        return;
      }

      for (
        const [
          key,
          childValue,
        ] of Object.entries(
          nestedValue as
          Record<string, unknown>
        )
      ) {
        if (unsafeKeys.has(key)) {
          throw new HttpsError(
            'invalid-argument',
            'The offer changes contain an invalid field.'
          );
        }

        inspect(childValue);
      }
    };

  inspect(value);
}


function structuredCloneSafe(
  value: Record<string, unknown>
): Record<string, unknown> {
  try {
    return JSON.parse(
      JSON.stringify(value)
    ) as Record<string, unknown>;
  } catch {
    throw new HttpsError(
      'invalid-argument',
      'The offer terms could not be processed.'
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
            ),
          ]
        )
    ) as T;
  }

  return value;
}
