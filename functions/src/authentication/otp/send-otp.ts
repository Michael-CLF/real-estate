import * as logger from 'firebase-functions/logger';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  callableFunctionOptions,
} from '../../shared/function-options';

import {
  normalizeEmail,
} from '../../shared/normalize-email';

import {
  OTP_EXPIRATION_MINUTES,
  OTP_HASH_SECRET,
  OTP_RESEND_COOLDOWN_SECONDS,
  SENDGRID_API_KEY,
} from './otp-config';

import {
  generateOtpCode,
  hashOtpCode,
} from './otp-crypto';

import {
  sendOtpEmail,
} from './otp-email.service';

import {
  deleteOtpRequest,
  saveOtpRequest,
} from './otp-repository';

import type {
  SendOtpRequest,
  SendOtpResponse,
} from './otp-types';

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Generates and emails a six-digit verification code.
 */
export const sendOtp = onCall<
  SendOtpRequest,
  Promise<SendOtpResponse>
>(
  {
    ...callableFunctionOptions,

    secrets: [
      SENDGRID_API_KEY,
      OTP_HASH_SECRET,
    ],
  },

  async request => {
    const email = normalizeEmail(
      request.data?.email,
    );

    if (
      !email ||
      email.length > 254 ||
      !EMAIL_PATTERN.test(email)
    ) {
      throw new HttpsError(
        'invalid-argument',
        'Enter a valid email address.',
      );
    }

    const hashSecret =
      OTP_HASH_SECRET.value();

    if (!hashSecret) {
      logger.error(
        'OTP_HASH_SECRET is not configured.',
      );

      throw new HttpsError(
        'failed-precondition',
        'Authentication is not configured correctly.',
      );
    }

    const code = generateOtpCode();

    const codeHash = hashOtpCode(
      email,
      code,
      hashSecret,
    );
    logger.info(
      'OTP hash created.',
      {
        emailDomain: getEmailDomain(email),
        hashFingerprint: codeHash.slice(0, 12),
      },
    );

    await saveOtpRequest(
      email,
      codeHash,
    );

    try {
      await sendOtpEmail(
        email,
        code,
      );
    } catch (error) {
      await deleteOtpRequest(email);

      logger.error(
        'Unable to send OTP email.',
        {
          error,
          emailDomain:
            getEmailDomain(email),
        },
      );

      throw new HttpsError(
        'internal',
        'We could not send your verification code. Please try again.',
      );
    }

    logger.info(
      'OTP email sent.',
      {
        emailDomain:
          getEmailDomain(email),
      },
    );

    return {
      success: true,

      expiresInSeconds:
        OTP_EXPIRATION_MINUTES *
        60,

      resendAvailableInSeconds:
        OTP_RESEND_COOLDOWN_SECONDS,
    };
  },
);

function getEmailDomain(
  email: string,
): string {
  return (
    email.split('@')[1] ??
    'unknown'
  );
}