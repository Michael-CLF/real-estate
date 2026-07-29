import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  adminAuth,
} from '../../shared/firebase-admin';

import {
  callableFunctionOptions,
} from '../../shared/function-options';

import {
  normalizeEmail,
} from '../../shared/normalize-email';

import {
  OTP_HASH_SECRET,
} from './otp-config';

import {
  hashOtpCode,
} from './otp-crypto';

import {
  verifyStoredOtp,
} from './otp-repository';

import type {
  VerifyOtpRequest,
  VerifyOtpResponse,
} from './otp-types';

const OTP_CODE_PATTERN = /^\d{6}$/;

/**
 * Verifies a six-digit OTP and returns a Firebase custom token.
 */
export const verifyOtp = onCall<
  VerifyOtpRequest,
  Promise<VerifyOtpResponse>
>(
  {
    ...callableFunctionOptions,

    secrets: [
      OTP_HASH_SECRET,
    ],
  },

  async request => {
    const email = normalizeEmail(
      request.data?.email,
    );

    const rawCode =
      request.data?.code;

    const code =
      typeof rawCode === 'string'
        ? rawCode.trim()
        : '';

    if (!email) {
      throw new HttpsError(
        'invalid-argument',
        'An email address is required.',
      );
    }

    if (!OTP_CODE_PATTERN.test(code)) {
      throw new HttpsError(
        'invalid-argument',
        'Enter the complete six-digit verification code.',
      );
    }

    const hashSecret =
      OTP_HASH_SECRET.value();

    if (!hashSecret) {
      throw new HttpsError(
        'failed-precondition',
        'Authentication is not configured correctly.',
      );
    }

    const submittedCodeHash =
      hashOtpCode(
        email,
        code,
        hashSecret,
      );

    const verification =
      await verifyStoredOtp(
        email,
        submittedCodeHash,
      );

    switch (verification.status) {
      case 'not-found':
        throw new HttpsError(
          'not-found',
          'No active verification code was found. Request a new code.',
        );

      case 'expired':
        throw new HttpsError(
          'deadline-exceeded',
          'This verification code has expired. Request a new code.',
        );

      case 'invalid':
        throw new HttpsError(
          'permission-denied',
          'The verification code is incorrect.',
          {
            attemptsRemaining:
              verification.attemptsRemaining,
          },
        );

      case 'locked':
        throw new HttpsError(
          'resource-exhausted',
          'Too many incorrect attempts were made. Request a new code.',
          {
            attemptsRemaining: 0,
          },
        );

      case 'verified':
        break;
    }

    const firebaseUser =
      await getOrCreateFirebaseUser(
        email,
      );

    const customToken =
      await adminAuth.createCustomToken(
        firebaseUser.uid,
        {
          authenticationMethod:
            'email_otp',
        },
      );

    return {
      success: true,
      customToken,
    };
  },
);

async function getOrCreateFirebaseUser(
  email: string,
) {
  try {
    const existingUser =
      await adminAuth.getUserByEmail(
        email,
      );

    if (!existingUser.emailVerified) {
      return adminAuth.updateUser(
        existingUser.uid,
        {
          emailVerified: true,
        },
      );
    }

    return existingUser;
  } catch (error: unknown) {
    if (
      isFirebaseUserNotFoundError(
        error,
      )
    ) {
      return adminAuth.createUser({
        email,
        emailVerified: true,
      });
    }

    throw error;
  }
}

function isFirebaseUserNotFoundError(
  error: unknown,
): boolean {
  if (
    typeof error !== 'object' ||
    error === null ||
    !('code' in error)
  ) {
    return false;
  }

  return (
    error.code ===
    'auth/user-not-found'
  );
}