import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  Timestamp
} from 'firebase-admin/firestore';

import {
  adminFirestore
} from '../shared/firebase-admin';

import {
  callableFunctionOptions
} from '../shared/function-options';

import {
  TRANSACTION_TASK_DEFINITIONS,
  validateListingUid
} from './transaction-definitions';

interface GetListingTransactionData {
  listingUid: string;
}

export const getListingTransaction =
  onCall<GetListingTransactionData>(
    {
      ...callableFunctionOptions
    },

    async request => {
      const authenticatedUserUid =
        request.auth?.uid;

      if (!authenticatedUserUid) {
        throw new HttpsError(
          'unauthenticated',
          'Sign in before viewing a contract timeline.'
        );
      }

      const listingUid =
        validateListingUid(
          request.data?.listingUid
        );

      const listingReference =
        adminFirestore
          .collection('listings')
          .doc(listingUid);

      const transactionReference =
        adminFirestore
          .collection(
            'listingTransactions'
          )
          .doc(listingUid);

      return (
        adminFirestore.runTransaction(
          async transaction => {
            const listingSnapshot =
              await transaction.get(
                listingReference
              );

            const transactionSnapshot =
              await transaction.get(
                transactionReference
              );

            if (!listingSnapshot.exists) {
              throw new HttpsError(
                'not-found',
                'The selected listing could not be found.'
              );
            }

            const listingData =
              listingSnapshot.data();

            const sellerUid =
              listingData?.['sellerUid'];

            if (
              typeof sellerUid !==
                'string' ||
              !sellerUid
            ) {
              throw new HttpsError(
                'data-loss',
                'The selected listing has no valid owner.'
              );
            }

            if (
              transactionSnapshot.exists
            ) {
              const existingTransaction =
                transactionSnapshot.data();

              const buyerUid =
                existingTransaction
                  ?.['buyerUid'];

              if (
                authenticatedUserUid !==
                  sellerUid &&
                authenticatedUserUid !==
                  buyerUid
              ) {
                throw new HttpsError(
                  'permission-denied',
                  'You do not have permission to view this contract timeline.'
                );
              }

              return serializeTransaction(
                listingUid,

                existingTransaction ?? {},

                authenticatedUserUid ===
                  sellerUid
              );
            }

            if (
              authenticatedUserUid !==
              sellerUid
            ) {
              throw new HttpsError(
                'permission-denied',
                'Only the listing owner may create the contract timeline.'
              );
            }

            const timestamp =
              Timestamp.now();

            const newTransaction = {
              listingUid,

              sellerUid,

              buyerUid:
                null,

              acceptedOfferUid:
                null,

              status:
                'preparing',

              tasks:
                TRANSACTION_TASK_DEFINITIONS
                  .map(
                    definition => ({
                      ...definition,

                      dueDate:
                        null,

                      status:
                        'pending',

                      completedAt:
                        null,

                      updatedAt:
                        timestamp,

                      updatedByUid:
                        authenticatedUserUid
                    })
                  ),

              createdAt:
                timestamp,

              updatedAt:
                timestamp,

              updatedByUid:
                authenticatedUserUid
            };

            transaction.create(
              transactionReference,
              newTransaction
            );

            return serializeTransaction(
              listingUid,
              newTransaction,
              true
            );
          }
        )
      );
    }
  );

export function serializeTransaction(
  listingUid: string,
  data: Record<string, unknown>,
  canEdit: boolean
): Record<string, unknown> {

  const tasks =
    Array.isArray(
      data['tasks']
    )
      ? data['tasks']
      : [];

  return {
    listingUid,

    sellerUid:
      data['sellerUid'],

    buyerUid:
      data['buyerUid'] ??
      null,

    acceptedOfferUid:
      data['acceptedOfferUid'] ??
      null,

    status:
      data['status'] ??
      'preparing',

    tasks:
      tasks.map(
        task => {
          const taskData =
            task as
              Record<string, unknown>;

          return {
            id:
              taskData['id'],

            label:
              taskData['label'],

            description:
              taskData['description'],

            dueDate:
              taskData['dueDate'] ??
              null,

            status:
              taskData['status'],

            completedAt:
              toIsoString(
                taskData['completedAt']
              ),

            updatedAt:
              toIsoString(
                taskData['updatedAt']
              ),

            updatedByUid:
              taskData['updatedByUid']
          };
        }
      ),

    createdAt:
      toIsoString(
        data['createdAt']
      ),

    updatedAt:
      toIsoString(
        data['updatedAt']
      ),

    updatedByUid:
      data['updatedByUid'],

    canEdit
  };
}

function toIsoString(
  value: unknown
): string | null {

  return value instanceof Timestamp
    ? value
      .toDate()
      .toISOString()
    : null;
}