import {
  defineSecret,
  defineString,
} from 'firebase-functions/params';

/**
 * SendGrid API key used to deliver OTP emails.
 *
 * This value will be stored in Google Cloud Secret Manager and
 * explicitly attached only to functions that need email delivery.
 */

export const OTP_SENDGRID_TEMPLATE_ID = defineString(
  "OTP_SENDGRID_TEMPLATE_ID"
);


export const SENDGRID_API_KEY =
  defineSecret('SENDGRID_API_KEY');

/**
 * Secret used to create HMAC hashes of OTP codes.
 *
 * OTP codes will never be stored as readable values in Firestore.
 */
export const OTP_HASH_SECRET =
  defineSecret('OTP_HASH_SECRET');

/**
 * Verified sender address configured in SendGrid.
 *
 * Example:
 * no-reply@navstreet.com
 */
export const OTP_FROM_EMAIL =
  defineString('OTP_FROM_EMAIL');

/**
 * Sender name displayed in the recipient's inbox.
 */
export const OTP_FROM_NAME =
  defineString('OTP_FROM_NAME', {
    default: 'NavStreet',
  });

/**
 * Number of minutes before an OTP expires.
 */
export const OTP_EXPIRATION_MINUTES = 10;

/**
 * Maximum number of incorrect verification attempts allowed for one
 * active OTP request.
 */
export const OTP_MAX_VERIFICATION_ATTEMPTS = 5;

/**
 * Minimum delay before another OTP may be sent to the same email.
 */
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

/**
 * Maximum number of OTP messages that may be sent to one email address
 * during the configured send window.
 */
export const OTP_MAX_SENDS_PER_WINDOW = 5;

/**
 * Length of the OTP send-rate window.
 */
export const OTP_SEND_WINDOW_MINUTES = 60;