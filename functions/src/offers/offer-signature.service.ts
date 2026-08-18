import {
  createHash,
  randomUUID,
  timingSafeEqual
} from 'node:crypto';

import {
  Timestamp
} from 'firebase-admin/firestore';

export type OfferSignerRole =
  | 'buyer'
  | 'seller';

export type OfferSignatureMethod =
  | 'typed_name'
  | 'external_provider';

export interface CreateOfferSignatureInput {
  signerUid: string;
  signerRole: OfferSignerRole;

  legalFirstName: string;
  legalMiddleName?: string | null;
  legalLastName: string;
  legalSuffix?: string | null;

  typedSignature: string;

  offerUid: string;
  offerVersionUid: string;

  documentUid: string;
  documentHash: string;

  signatureMethod:
    OfferSignatureMethod;

  consentToElectronicRecords: boolean;
  consentToElectronicSignature: boolean;
  certificationAccepted: boolean;

  signedFromIpAddress?: string | null;
  signedFromUserAgent?: string | null;

  identityVerificationUid?: string | null;
  identityVerificationProvider?: string | null;
  identityVerifiedAt?: Timestamp | null;

  externalSignatureUid?: string | null;
  externalEnvelopeUid?: string | null;
}

export interface OfferSignatureRecord {
  Uid: string;

  signerUid: string;
  signerRole: OfferSignerRole;

  legalFirstName: string;
  legalMiddleName: string | null;
  legalLastName: string;
  legalSuffix: string | null;
  legalFullName: string;

  typedSignature: string;

  offerUid: string;
  offerVersionUid: string;

  documentUid: string;
  documentHash: string;

  signatureMethod:
    OfferSignatureMethod;

  consentToElectronicRecords: true;
  consentToElectronicSignature: true;
  certificationAccepted: true;

  signedFromIpAddress: string | null;
  signedFromUserAgent: string | null;

  identityVerificationUid: string | null;
  identityVerificationProvider: string | null;
  identityVerifiedAt: Timestamp | null;

  externalSignatureUid: string | null;
  externalEnvelopeUid: string | null;

  signedAt: Timestamp;

  auditHash: string;
}

export interface VerifySignatureDocumentInput {
  expectedOfferUid: string;
  expectedOfferVersionUid: string;
  expectedDocumentUid: string;
  expectedDocumentHash: string;

  signature: OfferSignatureRecord;
}

/*
 * Creates the permanent signature evidence record.
 *
 * This service is intentionally provider-neutral. NavStreet can
 * use its own typed-signature experience initially and connect
 * DocuSign, Dropbox Sign or another provider later without
 * changing the stored signature structure.
 */
export function createOfferSignatureRecord(
  input: CreateOfferSignatureInput
): OfferSignatureRecord {
  const signerUid =
    requireNonEmptyString(
      input.signerUid,
      'signerUid'
    );

  const signerRole =
    validateSignerRole(
      input.signerRole
    );

  const legalFirstName =
    normalizeNamePart(
      input.legalFirstName,
      'legalFirstName'
    );

  const legalMiddleName =
    normalizeOptionalNamePart(
      input.legalMiddleName
    );

  const legalLastName =
    normalizeNamePart(
      input.legalLastName,
      'legalLastName'
    );

  const legalSuffix =
    normalizeOptionalNamePart(
      input.legalSuffix
    );

  const legalFullName =
    buildLegalFullName(
      legalFirstName,
      legalMiddleName,
      legalLastName,
      legalSuffix
    );

  const typedSignature =
    normalizeSignatureText(
      input.typedSignature
    );

  verifyTypedSignatureMatchesLegalName(
    typedSignature,
    legalFullName
  );

  verifyRequiredConsents(
    input
  );

  const offerUid =
    requireNonEmptyString(
      input.offerUid,
      'offerUid'
    );

  const offerVersionUid =
    requireNonEmptyString(
      input.offerVersionUid,
      'offerVersionUid'
    );

  const documentUid =
    requireNonEmptyString(
      input.documentUid,
      'documentUid'
    );

  const documentHash =
    normalizeSha256Hash(
      input.documentHash
    );

  const signatureMethod =
    validateSignatureMethod(
      input.signatureMethod
    );

  verifyIdentityEvidence(
    input
  );

  const signedAt =
    Timestamp.now();

  const signatureUid =
    randomUUID();

  const auditHash =
    createSignatureAuditHash({
      signatureUid,
      signerUid,
      signerRole,
      legalFullName,
      typedSignature,
      offerUid,
      offerVersionUid,
      documentUid,
      documentHash,
      signatureMethod,
      signedAt
    });

  return {
    Uid:
      signatureUid,

    signerUid,
    signerRole,

    legalFirstName,
    legalMiddleName,
    legalLastName,
    legalSuffix,
    legalFullName,

    typedSignature,

    offerUid,
    offerVersionUid,

    documentUid,
    documentHash,

    signatureMethod,

    consentToElectronicRecords:
      true,

    consentToElectronicSignature:
      true,

    certificationAccepted:
      true,

    signedFromIpAddress:
      normalizeOptionalString(
        input.signedFromIpAddress
      ),

    signedFromUserAgent:
      normalizeOptionalString(
        input.signedFromUserAgent
      ),

    identityVerificationUid:
      normalizeOptionalString(
        input.identityVerificationUid
      ),

    identityVerificationProvider:
      normalizeOptionalString(
        input.identityVerificationProvider
      ),

    identityVerifiedAt:
      input.identityVerifiedAt ?? null,

    externalSignatureUid:
      normalizeOptionalString(
        input.externalSignatureUid
      ),

    externalEnvelopeUid:
      normalizeOptionalString(
        input.externalEnvelopeUid
      ),

    signedAt,

    auditHash
  };
}

/*
 * Confirms that a stored signature belongs to the exact
 * immutable offer document being evaluated.
 *
 * A signature for one version must never be copied to or
 * reused on another offer version.
 */
export function verifySignatureDocumentBinding(
  input: VerifySignatureDocumentInput
): void {
  const expectedOfferUid =
    requireNonEmptyString(
      input.expectedOfferUid,
      'expectedOfferUid'
    );

  const expectedOfferVersionUid =
    requireNonEmptyString(
      input.expectedOfferVersionUid,
      'expectedOfferVersionUid'
    );

  const expectedDocumentUid =
    requireNonEmptyString(
      input.expectedDocumentUid,
      'expectedDocumentUid'
    );

  const expectedDocumentHash =
    normalizeSha256Hash(
      input.expectedDocumentHash
    );

  if (
    input.signature.offerUid !==
    expectedOfferUid
  ) {
    throw new Error(
      'The signature belongs to a different offer.'
    );
  }

  if (
    input.signature.offerVersionUid !==
    expectedOfferVersionUid
  ) {
    throw new Error(
      'The signature belongs to a different offer version.'
    );
  }

  if (
    input.signature.documentUid !==
    expectedDocumentUid
  ) {
    throw new Error(
      'The signature belongs to a different document.'
    );
  }

  if (
    !secureStringEquals(
      input.signature.documentHash,
      expectedDocumentHash
    )
  ) {
    throw new Error(
      'The signed document hash does not match the current document.'
    );
  }
}

/*
 * Recalculates the audit hash and confirms that the stored
 * signature evidence has not been altered.
 */
export function verifySignatureAuditHash(
  signature: OfferSignatureRecord
): void {
  const calculatedHash =
    createSignatureAuditHash({
      signatureUid:
        signature.Uid,

      signerUid:
        signature.signerUid,

      signerRole:
        signature.signerRole,

      legalFullName:
        signature.legalFullName,

      typedSignature:
        signature.typedSignature,

      offerUid:
        signature.offerUid,

      offerVersionUid:
        signature.offerVersionUid,

      documentUid:
        signature.documentUid,

      documentHash:
        signature.documentHash,

      signatureMethod:
        signature.signatureMethod,

      signedAt:
        signature.signedAt
    });

  if (
    !secureStringEquals(
      calculatedHash,
      signature.auditHash
    )
  ) {
    throw new Error(
      'The signature audit record failed its integrity check.'
    );
  }
}

interface SignatureAuditHashInput {
  signatureUid: string;

  signerUid: string;
  signerRole: OfferSignerRole;

  legalFullName: string;
  typedSignature: string;

  offerUid: string;
  offerVersionUid: string;

  documentUid: string;
  documentHash: string;

  signatureMethod:
    OfferSignatureMethod;

  signedAt: Timestamp;
}

function createSignatureAuditHash(
  input: SignatureAuditHashInput
): string {
  const auditValue = [
    input.signatureUid,
    input.signerUid,
    input.signerRole,
    input.legalFullName,
    input.typedSignature,
    input.offerUid,
    input.offerVersionUid,
    input.documentUid,
    input.documentHash,
    input.signatureMethod,
    input.signedAt.toMillis()
  ].join('|');

  return createHash('sha256')
    .update(
      auditValue,
      'utf8'
    )
    .digest('hex');
}

function verifyRequiredConsents(
  input: CreateOfferSignatureInput
): void {
  if (
    input.consentToElectronicRecords !== true
  ) {
    throw new Error(
      'Consent to receive electronic records is required.'
    );
  }

  if (
    input.consentToElectronicSignature !== true
  ) {
    throw new Error(
      'Consent to use an electronic signature is required.'
    );
  }

  if (
    input.certificationAccepted !== true
  ) {
    throw new Error(
      'The signer certification must be accepted.'
    );
  }
}

function verifyIdentityEvidence(
  input: CreateOfferSignatureInput
): void {
  const identityVerificationUid =
    normalizeOptionalString(
      input.identityVerificationUid
    );

  const identityVerificationProvider =
    normalizeOptionalString(
      input.identityVerificationProvider
    );

  if (
    !identityVerificationUid ||
    !identityVerificationProvider ||
    !input.identityVerifiedAt
  ) {
    throw new Error(
      'Verified identity evidence is required before signing.'
    );
  }

  const identityAgeMilliseconds =
    Date.now() -
    input.identityVerifiedAt.toMillis();

  if (identityAgeMilliseconds < 0) {
    throw new Error(
      'The identity verification date is invalid.'
    );
  }
}

function verifyTypedSignatureMatchesLegalName(
  typedSignature: string,
  legalFullName: string
): void {
  if (
    normalizeNameForComparison(
      typedSignature
    ) !==
    normalizeNameForComparison(
      legalFullName
    )
  ) {
    throw new Error(
      'The typed signature must match the verified legal name.'
    );
  }
}

function buildLegalFullName(
  firstName: string,
  middleName: string | null,
  lastName: string,
  suffix: string | null
): string {
  return [
    firstName,
    middleName,
    lastName,
    suffix
  ]
    .filter(
      (
        value
      ): value is string =>
        Boolean(value)
    )
    .join(' ');
}

function validateSignerRole(
  value: unknown
): OfferSignerRole {
  if (
    value !== 'buyer' &&
    value !== 'seller'
  ) {
    throw new Error(
      'The signer role must be buyer or seller.'
    );
  }

  return value;
}

function validateSignatureMethod(
  value: unknown
): OfferSignatureMethod {
  if (
    value !== 'typed_name' &&
    value !== 'external_provider'
  ) {
    throw new Error(
      'The signature method is not supported.'
    );
  }

  return value;
}

function normalizeSha256Hash(
  value: unknown
): string {
  const hash =
    requireNonEmptyString(
      value,
      'documentHash'
    ).toLowerCase();

  if (
    !/^[a-f0-9]{64}$/.test(hash)
  ) {
    throw new Error(
      'The document hash must be a valid SHA-256 hash.'
    );
  }

  return hash;
}

function normalizeSignatureText(
  value: unknown
): string {
  return requireNonEmptyString(
    value,
    'typedSignature'
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}

function normalizeNamePart(
  value: unknown,
  fieldName: string
): string {
  return requireNonEmptyString(
    value,
    fieldName
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}

function normalizeOptionalNamePart(
  value: unknown
): string | null {
  const normalized =
    normalizeOptionalString(
      value
    );

  return normalized
    ? normalized.replace(
        /\s+/g,
        ' '
      )
    : null;
}

function normalizeNameForComparison(
  value: string
): string {
  return value
    .normalize('NFKD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-zA-Z0-9]/g,
      ''
    )
    .toLowerCase();
}

function normalizeOptionalString(
  value: unknown
): string | null {
  if (
    typeof value !== 'string'
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized.length > 0
    ? normalized
    : null;
}

function requireNonEmptyString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${fieldName} is required.`
    );
  }

  return value.trim();
}

function secureStringEquals(
  first: string,
  second: string
): boolean {
  const firstBuffer =
    Buffer.from(
      first,
      'utf8'
    );

  const secondBuffer =
    Buffer.from(
      second,
      'utf8'
    );

  if (
    firstBuffer.length !==
    secondBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    firstBuffer,
    secondBuffer
  );
}