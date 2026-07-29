import {
  Timestamp,
} from 'firebase-admin/firestore';

import {
  HttpsError,
} from 'firebase-functions/v2/https';

import {
  adminFirestore,
} from '../../shared/firebase-admin';

import {
  OTP_EXPIRATION_MINUTES,
  OTP_MAX_SENDS_PER_WINDOW,
  OTP_MAX_VERIFICATION_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_SEND_WINDOW_MINUTES,
} from './otp-config';

import {
  createEmailDocumentId,
  hashesMatch,
} from './otp-crypto';

import type {
  OtpRequestDocument,
  OtpVerificationResult,
} from './otp-types';

function getOtpDocumentReference(
  email: string,
) {
  const documentId =
    createEmailDocumentId(email);

  return adminFirestore
    .collection('system')
    .doc('authentication')
    .collection('otpRequests')
    .doc(documentId);
}

/**
 * Saves a new OTP request and enforces resend throttling.
 */
export async function saveOtpRequest(
  email: string,
  codeHash: string,
): Promise<void> {
  const documentReference =
    getOtpDocumentReference(email);

  await adminFirestore.runTransaction(
    async transaction => {
      const snapshot = await transaction.get(
        documentReference,
      );

      const nowMilliseconds = Date.now();
      const now =
        Timestamp.fromMillis(nowMilliseconds);

      const expiresAt = Timestamp.fromMillis(
        nowMilliseconds +
          OTP_EXPIRATION_MINUTES *
            60 *
            1000,
      );

      let sendCount = 1;
      let sendWindowStartedAt = now;

      if (snapshot.exists) {
        const existing =
          snapshot.data() as OtpRequestDocument;

        const secondsSinceLastSend =
          (
            nowMilliseconds -
            existing.lastSentAt.toMillis()
          ) / 1000;

        if (
          secondsSinceLastSend <
          OTP_RESEND_COOLDOWN_SECONDS
        ) {
          const waitSeconds = Math.ceil(
            OTP_RESEND_COOLDOWN_SECONDS -
              secondsSinceLastSend,
          );

          throw new HttpsError(
            'resource-exhausted',
            `Please wait ${waitSeconds} seconds before requesting another code.`,
          );
        }

        const sendWindowAgeMilliseconds =
          nowMilliseconds -
          existing.sendWindowStartedAt.toMillis();

        const sendWindowDurationMilliseconds =
          OTP_SEND_WINDOW_MINUTES *
          60 *
          1000;

        if (
          sendWindowAgeMilliseconds <
          sendWindowDurationMilliseconds
        ) {
          if (
            existing.sendCount >=
            OTP_MAX_SENDS_PER_WINDOW
          ) {
            throw new HttpsError(
              'resource-exhausted',
              'Too many verification codes have been requested. Please try again later.',
            );
          }

          sendCount =
            existing.sendCount + 1;

          sendWindowStartedAt =
            existing.sendWindowStartedAt;
        }
      }

      const document: OtpRequestDocument = {
        email,
        codeHash,

        attempts: 0,
        maxAttempts:
          OTP_MAX_VERIFICATION_ATTEMPTS,

        sendCount,

        createdAt: now,
        expiresAt,
        lastSentAt: now,
        sendWindowStartedAt,
      };

      transaction.set(
        documentReference,
        document,
      );
    },
  );
}

/**
 * Deletes an active OTP request.
 */
export async function deleteOtpRequest(
  email: string,
): Promise<void> {
  await getOtpDocumentReference(
    email,
  ).delete();
}

/**
 * Verifies a submitted OTP hash and updates the attempt counter
 * atomically.
 */
export async function verifyStoredOtp(
  email: string,
  submittedCodeHash: string,
): Promise<OtpVerificationResult> {
  const documentReference =
    getOtpDocumentReference(email);

  return adminFirestore.runTransaction(
    async transaction => {
      const snapshot = await transaction.get(
        documentReference,
      );

      if (!snapshot.exists) {
        return {
          status: 'not-found',
          attemptsRemaining: 0,
        };
      }

      const document =
        snapshot.data() as OtpRequestDocument;

      const nowMilliseconds = Date.now();

      if (
        document.expiresAt.toMillis() <=
        nowMilliseconds
      ) {
        transaction.delete(documentReference);

        return {
          status: 'expired',
          attemptsRemaining: 0,
        };
      }

      if (
        document.attempts >=
        document.maxAttempts
      ) {
        transaction.delete(documentReference);

        return {
          status: 'locked',
          attemptsRemaining: 0,
        };
      }

      const matches = hashesMatch(
        document.codeHash,
        submittedCodeHash,
      );

      if (matches) {
        transaction.delete(documentReference);

        return {
          status: 'verified',
          attemptsRemaining:
            document.maxAttempts -
            document.attempts,
        };
      }

      const nextAttemptCount =
        document.attempts + 1;

      const attemptsRemaining = Math.max(
        document.maxAttempts -
          nextAttemptCount,
        0,
      );

      if (attemptsRemaining === 0) {
        transaction.delete(documentReference);

        return {
          status: 'locked',
          attemptsRemaining: 0,
        };
      }

      transaction.update(
        documentReference,
        {
          attempts: nextAttemptCount,
        },
      );

      return {
        status: 'invalid',
        attemptsRemaining,
      };
    },
  );
}