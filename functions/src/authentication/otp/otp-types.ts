import type {
  Timestamp,
} from 'firebase-admin/firestore';

/**
 * Data accepted by the sendOtp callable function.
 */
export interface SendOtpRequest {
  email?: unknown;
}

/**
 * Data returned after an OTP is successfully sent.
 */
export interface SendOtpResponse {
  success: true;
  expiresInSeconds: number;
  resendAvailableInSeconds: number;
}

/**
 * Data accepted by the verifyOtp callable function.
 */
export interface VerifyOtpRequest {
  email?: unknown;
  code?: unknown;
}

/**
 * Data returned after an OTP is successfully verified.
 */
export interface VerifyOtpResponse {
  success: true;
  customToken: string;
}

/**
 * Firestore representation of one active OTP request.
 *
 * The readable OTP code is never stored. Only its HMAC hash is saved.
 */
export interface OtpRequestDocument {
  email: string;
  codeHash: string;

  attempts: number;
  maxAttempts: number;

  sendCount: number;

  createdAt: Timestamp;
  expiresAt: Timestamp;
  lastSentAt: Timestamp;
  sendWindowStartedAt: Timestamp;
}

/**
 * Internal result returned by the OTP repository after attempting
 * verification.
 */
export type OtpVerificationResult =
  | {
      status: 'verified';
      attemptsRemaining: number;
    }
  | {
      status: 'not-found';
      attemptsRemaining: 0;
    }
  | {
      status: 'expired';
      attemptsRemaining: 0;
    }
  | {
      status: 'invalid';
      attemptsRemaining: number;
    }
  | {
      status: 'locked';
      attemptsRemaining: 0;
    };