import {
  randomInt
} from 'node:crypto';

import {
  FieldValue
} from 'firebase-admin/firestore';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  adminFirestore
} from '../shared/firebase-admin';

import {
  callableFunctionOptions
} from '../shared/function-options';

interface EnsureUserAccountNumberResponse {
  accountNumber: string;
}

class AccountNumberCollisionError extends Error {
  constructor() {
    super('The generated account number is already assigned.');
    this.name = 'AccountNumberCollisionError';
  }
}

export const ensureUserAccountNumber =
  onCall(
    callableFunctionOptions,
    async (
      request
    ): Promise<EnsureUserAccountNumberResponse> => {
      const userUid =
        request.auth?.uid;

      if (!userUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must be signed in to access an account number.'
        );
      }

      const userReference =
        adminFirestore
          .collection('users')
          .doc(userUid);

      for (
        let attempt = 0;
        attempt < 10;
        attempt += 1
      ) {
        const accountNumber =
          createAccountNumber();

        try {
          return await adminFirestore.runTransaction(
            async transaction => {
              const userSnapshot =
                await transaction.get(
                  userReference
                );

              if (!userSnapshot.exists) {
                throw new HttpsError(
                  'not-found',
                  'Your NavStreet account profile could not be found.'
                );
              }

              const existingAccountNumber =
                userSnapshot.get(
                  'accountNumber'
                );

              if (
                typeof existingAccountNumber ===
                  'string' &&
                existingAccountNumber.trim()
              ) {
                return {
                  accountNumber:
                    existingAccountNumber.trim()
                };
              }

              const accountNumberReference =
                adminFirestore
                  .collection('accountNumbers')
                  .doc(accountNumber);

              const accountNumberSnapshot =
                await transaction.get(
                  accountNumberReference
                );

              if (accountNumberSnapshot.exists) {
                throw new AccountNumberCollisionError();
              }

              transaction.create(
                accountNumberReference,
                {
                  accountNumber,
                  userUid,
                  createdAt:
                    FieldValue.serverTimestamp()
                }
              );

              transaction.update(
                userReference,
                {
                  accountNumber,
                  updatedAt:
                    FieldValue.serverTimestamp()
                }
              );

              return {
                accountNumber
              };
            }
          );
        } catch (error: unknown) {
          if (
            error instanceof
              AccountNumberCollisionError
          ) {
            continue;
          }

          if (error instanceof HttpsError) {
            throw error;
          }

          console.error(
            'Unable to assign NavStreet account number:',
            error
          );

          throw new HttpsError(
            'internal',
            'Your NavStreet account number could not be assigned.'
          );
        }
      }

      throw new HttpsError(
        'resource-exhausted',
        'A unique NavStreet account number could not be generated.'
      );
    }
  );

function createAccountNumber(): string {
  const numericPortion =
    randomInt(
      10_000_000,
      100_000_000
    );

  return `NS-${numericPortion}`;
}