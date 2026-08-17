import * as logger from 'firebase-functions/logger';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  FieldValue
} from 'firebase-admin/firestore';

import {
  callableFunctionOptions
} from '../shared/function-options';

import {
  adminFirestore
} from '../shared/firebase-admin';

type SellerControlledListingStatus =
  | 'active'
  | 'paused'
  | 'under_contract'
  | 'sold'
  | 'withdrawn';

type StoredListingStatus =
  | 'published'
  | SellerControlledListingStatus;

type ListingStatusChangeType =
  | 'paused'
  | 'reactivated'
  | 'under_contract'
  | 'sold'
  | 'withdrawn';

interface UpdateListingStatusData {
  listingUid: string;
  newStatus: SellerControlledListingStatus;
  reason?: string;
}

interface UpdateListingStatusResponse {
  listingUid: string;
  previousStatus: StoredListingStatus;
  newStatus: SellerControlledListingStatus;
  statusChangeType: ListingStatusChangeType;
  statusHistoryUid: string;
}

const MAXIMUM_REASON_LENGTH = 500;

const SELLER_CONTROLLED_STATUSES:
  readonly SellerControlledListingStatus[] = [
    'active',
    'paused',
    'under_contract',
    'sold',
    'withdrawn'
  ];

const PERMITTED_TRANSITIONS:
  Readonly<
    Record<
      StoredListingStatus,
      readonly SellerControlledListingStatus[]
    >
  > = {
    published: [
      'paused',
      'under_contract',
      'sold',
      'withdrawn'
    ],

    active: [
      'paused',
      'under_contract',
      'sold',
      'withdrawn'
    ],

    paused: [
      'active',
      'withdrawn'
    ],

    under_contract: [
      'active',
      'sold',
      'withdrawn'
    ],

    sold: [],

    withdrawn: []
  };

export const updateListingStatus = onCall<
  UpdateListingStatusData,
  Promise<UpdateListingStatusResponse>
>(
  {
    ...callableFunctionOptions
  },

  async request => {
    const currentUserUid =
      request.auth?.uid;

    if (!currentUserUid) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in before changing a listing status.'
      );
    }

    const listingUid =
      requireNonEmptyString(
        request.data?.listingUid,
        'A listing UID is required.'
      );

    const newStatus =
      requireSellerControlledStatus(
        request.data?.newStatus
      );

    const reason =
      normalizeReason(
        request.data?.reason
      );

    if (
      newStatus === 'withdrawn' &&
      !reason
    ) {
      throw new HttpsError(
        'invalid-argument',
        'A withdrawal reason is required.'
      );
    }

    const listingReference =
      adminFirestore
        .collection('listings')
        .doc(listingUid);

    const statusHistoryReference =
      listingReference
        .collection('statusHistory')
        .doc();

    try {
      const response =
        await adminFirestore.runTransaction(
          async transaction => {
            const listingSnapshot =
              await transaction.get(
                listingReference
              );

            if (!listingSnapshot.exists) {
              throw new HttpsError(
                'not-found',
                'The selected listing could not be found.'
              );
            }

            const listingData =
              listingSnapshot.data() ?? {};

            const sellerUid =
              readString(
                listingData['sellerUid']
              );

            if (
              !sellerUid ||
              sellerUid !== currentUserUid
            ) {
              throw new HttpsError(
                'permission-denied',
                'Only the listing seller may change this status.'
              );
            }

            const previousStatus =
              requireStoredStatus(
                listingData['status']
              );

            if (
              previousStatus ===
              newStatus
            ) {
              throw new HttpsError(
                'already-exists',
                `This listing is already ${newStatus}.`
              );
            }

            const permittedStatuses =
              PERMITTED_TRANSITIONS[
                previousStatus
              ];

            if (
              !permittedStatuses.includes(
                newStatus
              )
            ) {
              throw new HttpsError(
                'failed-precondition',
                `A listing cannot change from ${previousStatus} to ${newStatus}.`
              );
            }

            const statusChangeType =
              determineStatusChangeType(
                previousStatus,
                newStatus
              );

            const timestampField =
              determineTimestampField(
                statusChangeType
              );

            transaction.update(
              listingReference,
              {
                status:
                  newStatus,

                updatedAt:
                  FieldValue.serverTimestamp(),

                statusChangedAt:
                  FieldValue.serverTimestamp(),

                [timestampField]:
                  FieldValue.serverTimestamp()
              }
            );

            transaction.set(
              statusHistoryReference,
              {
                statusHistoryUid:
                  statusHistoryReference.id,

                listingUid,

                sellerUid,

                previousStatus,

                newStatus,

                statusChangeType,

                reason:
                  reason || null,

                changedByUid:
                  currentUserUid,

                changedAt:
                  FieldValue.serverTimestamp()
              }
            );

            return {
              listingUid,
              previousStatus,
              newStatus,
              statusChangeType,
              statusHistoryUid:
                statusHistoryReference.id
            };
          }
        );

      logger.info(
        'Listing status updated.',
        {
          listingUid,
          sellerUid:
            currentUserUid,
          previousStatus:
            response.previousStatus,
          newStatus:
            response.newStatus,
          statusChangeType:
            response.statusChangeType,
          statusHistoryUid:
            response.statusHistoryUid
        }
      );

      return response;
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        'Unable to update listing status.',
        {
          listingUid,
          sellerUid:
            currentUserUid,
          requestedStatus:
            newStatus,
          error
        }
      );

      throw new HttpsError(
        'internal',
        'We could not update this listing status. Please try again.'
      );
    }
  }
);

function requireNonEmptyString(
  value: unknown,
  errorMessage: string
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      errorMessage
    );
  }

  return value.trim();
}

function normalizeReason(
  value: unknown
): string {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'The status reason must be text.'
    );
  }

  const normalizedReason =
    value.trim();

  if (
    normalizedReason.length >
    MAXIMUM_REASON_LENGTH
  ) {
    throw new HttpsError(
      'invalid-argument',
      `The status reason cannot exceed ${MAXIMUM_REASON_LENGTH} characters.`
    );
  }

  return normalizedReason;
}

function requireSellerControlledStatus(
  value: unknown
): SellerControlledListingStatus {
  if (
    typeof value !== 'string' ||
    !SELLER_CONTROLLED_STATUSES.includes(
      value as SellerControlledListingStatus
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The requested listing status is not supported.'
    );
  }

  return value as SellerControlledListingStatus;
}

function requireStoredStatus(
  value: unknown
): StoredListingStatus {
  if (
    value === 'published' ||
    value === 'active' ||
    value === 'paused' ||
    value === 'under_contract' ||
    value === 'sold' ||
    value === 'withdrawn'
  ) {
    return value;
  }

  throw new HttpsError(
    'failed-precondition',
    'This listing is not currently eligible for seller status changes.'
  );
}

function determineStatusChangeType(
  previousStatus: StoredListingStatus,
  newStatus: SellerControlledListingStatus
): ListingStatusChangeType {
  if (newStatus === 'paused') {
    return 'paused';
  }

  if (newStatus === 'under_contract') {
    return 'under_contract';
  }

  if (newStatus === 'sold') {
    return 'sold';
  }

  if (newStatus === 'withdrawn') {
    return 'withdrawn';
  }

  if (
    newStatus === 'active' &&
    (
      previousStatus === 'paused' ||
      previousStatus ===
        'under_contract'
    )
  ) {
    return 'reactivated';
  }

  throw new HttpsError(
    'failed-precondition',
    'The requested listing status transition is not supported.'
  );
}

function determineTimestampField(
  statusChangeType: ListingStatusChangeType
):
  | 'pausedAt'
  | 'reactivatedAt'
  | 'underContractAt'
  | 'soldAt'
  | 'withdrawnAt' {
  switch (statusChangeType) {
    case 'paused':
      return 'pausedAt';

    case 'reactivated':
      return 'reactivatedAt';

    case 'under_contract':
      return 'underContractAt';

    case 'sold':
      return 'soldAt';

    case 'withdrawn':
      return 'withdrawnAt';
  }
}

function readString(
  value: unknown
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue =
    value.trim();

  return normalizedValue
    ? normalizedValue
    : null;
}