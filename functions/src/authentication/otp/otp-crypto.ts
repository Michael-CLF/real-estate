import {
  createHash,
  createHmac,
  randomInt,
  timingSafeEqual,
} from 'node:crypto';

/**
 * Generates a cryptographically secure six-digit OTP.
 */
export function generateOtpCode(): string {
  return randomInt(0, 1_000_000)
    .toString()
    .padStart(6, '0');
}

/**
 * Creates an HMAC hash that binds the OTP to the normalized email.
 */
export function hashOtpCode(
  email: string,
  code: string,
  secret: string,
): string {
  return createHmac('sha256', secret)
    .update(`${email}:${code}`)
    .digest('hex');
}

/**
 * Creates a deterministic Firestore document ID without exposing the
 * recipient's email address in the document path.
 */
export function createEmailDocumentId(
  email: string,
): string {
  return createHash('sha256')
    .update(email)
    .digest('hex');
}

/**
 * Compares hexadecimal hashes using a timing-safe comparison.
 */
export function hashesMatch(
  expectedHash: string,
  submittedHash: string,
): boolean {
  if (
    !isValidSha256Hex(expectedHash) ||
    !isValidSha256Hex(submittedHash)
  ) {
    return false;
  }

  const expectedBuffer = Buffer.from(
    expectedHash,
    'hex',
  );

  const submittedBuffer = Buffer.from(
    submittedHash,
    'hex',
  );

  return timingSafeEqual(
    expectedBuffer,
    submittedBuffer,
  );
}

function isValidSha256Hex(
  value: string,
): boolean {
  return /^[a-f0-9]{64}$/i.test(value);
}