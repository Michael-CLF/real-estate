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
  validateListingUid,
  validateSubmittedTasks
} from './transaction-definitions';

import {
  serializeTransaction
} from './get-listing-transaction';

interface SaveListingTransactionData {
  listingUid: string;
  tasks: unknown[];
}

export const saveListingTransaction =
  onCall<SaveListingTransactionData>(
    {
      ...callableFunctionOptions
    },

    async request => {
      const authenticatedUserUid =
        request.auth?.uid;

      if (!authenticatedUserUid) {
        throw new HttpsError(
          'unauthenticated',
          'Sign in before updating a contract timeline.'
        );
      }

      const listingUid =
        validateListingUid(
          request.data?.listingUid
        );

      const submittedTasks =
        validateSubmittedTasks(
          request.data?.tasks
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

            const sellerUid =
              listingSnapshot
                .data()
                ?.['sellerUid'];

            if (
              sellerUid !==
              authenticatedUserUid
            ) {
              throw new HttpsError(
                'permission-denied',
                'Only the listing owner may update this contract timeline.'
              );
            }

            if (
              !transactionSnapshot.exists
            ) {
              throw new HttpsError(
                'failed-precondition',
                'Open the contract timeline before saving it.'
              );
            }

            const existingData =
              transactionSnapshot.data() ??
              {};

            const existingTasks =
              Array.isArray(
                existingData['tasks']
              )
                ? existingData['tasks']
                : [];

            const timestamp =
              Timestamp.now();

            const tasks =
              TRANSACTION_TASK_DEFINITIONS
                .map(
                  definition => {
                    const submittedTask =
                      submittedTasks.find(
                        task =>
                          task.id ===
                          definition.id
                      );

                    const existingTask =
                      existingTasks.find(
                        task =>
                          (
                            task as
                              Record<
                                string,
                                unknown
                              >
                          )['id'] ===
                          definition.id
                      ) as
                        Record<
                          string,
                          unknown
                        > |
                        undefined;

                    if (!submittedTask) {
                      throw new HttpsError(
                        'invalid-argument',
                        'The contract timeline tasks are incomplete.'
                      );
                    }

                    const completedAt =
                      submittedTask.status ===
                        'completed'
                        ? (
                          existingTask
                            ?.['status'] ===
                            'completed'
                            ? existingTask[
                              'completedAt'
                            ]
                            : timestamp
                        )
                        : null;

                    return {
                      ...definition,

                      dueDate:
                        submittedTask
                          .dueDate,

                      status:
                        submittedTask
                          .status,

                      completedAt,

                      updatedAt:
                        timestamp,

                      updatedByUid:
                        authenticatedUserUid
                    };
                  }
                );

            const updates = {
              tasks,

              updatedAt:
                timestamp,

              updatedByUid:
                authenticatedUserUid
            };

            transaction.update(
              transactionReference,
              updates
            );

            return serializeTransaction(
              listingUid,

              {
                ...existingData,
                ...updates
              },

              true
            );
          }
        )
      );
    }
  );