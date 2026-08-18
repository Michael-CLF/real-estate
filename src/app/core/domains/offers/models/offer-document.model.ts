import {
  OfferDocumentStatus,
  OfferSignatureRequestStatus
} from './offer-status.model';


/*
 * Types of documents that may belong to an offer,
 * counteroffer or resulting transaction.
 */
export type OfferDocumentType =
  | 'offer_agreement'
  | 'counteroffer_agreement'
  | 'accepted_agreement'
  | 'addendum'
  | 'disclosure'
  | 'preapproval_letter'
  | 'proof_of_funds'
  | 'identity_verification_record'
  | 'signature_certificate'
  | 'audit_certificate'
  | 'attorney_prepared_provision'
  | 'supporting_document'
  | 'termination_notice'
  | 'amendment'
  | 'closing_document';


/*
 * Identifies the party who uploaded or generated a
 * document.
 */
export type OfferDocumentSource =
  | 'buyer'
  | 'seller'
  | 'navstreet'
  | 'attorney'
  | 'signature_provider'
  | 'identity_provider'
  | 'closing_attorney'
  | 'external';


/*
 * Controls which participants may access a document.
 */
export type OfferDocumentVisibility =
  | 'buyer_and_seller'
  | 'buyer_only'
  | 'seller_only'
  | 'participating_attorneys'
  | 'navstreet_internal';


/*
 * Describes the state-specific template used to generate
 * an offer or contract document.
 */
export interface OfferDocumentTemplateReference {
  stateCode: string;

  templateUid: string;
  templateName: string;
  templateVersion: string;

  effectiveDate: string;

  /*
   * Indicates whether this is an internal prototype or a
   * production-authorized template.
   */
  releaseStatus:
    | 'prototype'
    | 'attorney_review'
    | 'approved'
    | 'retired';

  approvedByAttorneyUid?: string;
  approvedAt?: Date;
}


/*
 * Hash information used to prove that a document has not
 * changed after generation or signature.
 */
export interface OfferDocumentHash {
  algorithm: 'SHA-256';
  value: string;
  calculatedAt: Date;
}


/*
 * Signature information for one signer on one document.
 */
export interface OfferDocumentSigner {
  partyUid: string;
  userUid?: string;

  role:
    | 'buyer'
    | 'seller';

  legalName: string;
  email: string;

  required: boolean;

  status:
    | 'not_started'
    | 'invited'
    | 'viewed'
    | 'signed'
    | 'declined';

  providerSignerUid?: string;

  invitedAt?: Date;
  viewedAt?: Date;
  signedAt?: Date;
  declinedAt?: Date;

  /*
   * The signature image itself should remain with the
   * signature provider or inside the final PDF. Do not
   * store base64 signature images in Firestore.
   */
  signaturePageNumber?: number;
}


/*
 * Electronic-signature request associated with a generated
 * document.
 */
export interface OfferDocumentSignatureRequest {
  status: OfferSignatureRequestStatus;

  provider?: string;

  providerEnvelopeUid?: string;
  providerRequestUid?: string;

  signers: OfferDocumentSigner[];

  createdAt?: Date;
  sentAt?: Date;
  completedAt?: Date;
  declinedAt?: Date;
  expiredAt?: Date;
  cancelledAt?: Date;

  completionCertificateDocumentUid?: string;
}


/*
 * Records electronic delivery of a document to a buyer,
 * seller or other authorized recipient.
 */
export interface OfferDocumentDelivery {
  recipientPartyUid?: string;
  recipientUserUid?: string;

  recipientName: string;
  recipientEmail: string;

  deliveryMethod:
    | 'navstreet_account'
    | 'email'
    | 'signature_provider'
    | 'manual';

  status:
    | 'pending'
    | 'sent'
    | 'delivered'
    | 'viewed'
    | 'failed';

  sentAt?: Date;
  deliveredAt?: Date;
  viewedAt?: Date;
  failedAt?: Date;

  failureMessage?: string;
}


/*
 * Represents one permanent file associated with an offer
 * or transaction.
 */
export interface OfferDocument {
  Uid: string;

  offerUid: string;
  offerVersionUid?: string;
  contractUid?: string;

  type: OfferDocumentType;
  source: OfferDocumentSource;
  visibility: OfferDocumentVisibility;

  title: string;
  fileName: string;
  contentType: string;

  /*
   * Firebase Storage path.
   *
   * Do not store public download URLs permanently because
   * authorized download URLs may expire or be revoked.
   */
  storagePath: string;

  sizeInBytes?: number;
  pageCount?: number;

  status: OfferDocumentStatus;

  template?: OfferDocumentTemplateReference;

  hash?: OfferDocumentHash;

  signatureRequest?:
    OfferDocumentSignatureRequest;

  deliveries: OfferDocumentDelivery[];

  /*
   * The document can be downloaded and printed by all
   * authorized participants when this value is true.
   */
  downloadable: boolean;
  printable: boolean;

  generatedAt?: Date;
  uploadedAt?: Date;

  createdByUid: string;

  createdAt: Date;
  updatedAt: Date;
}


/*
 * Data used to create a new document record before a file
 * has been generated or uploaded.
 */
export type InitialOfferDocument = Omit<
  OfferDocument,
  | 'Uid'
  | 'hash'
  | 'deliveries'
  | 'generatedAt'
  | 'uploadedAt'
  | 'createdAt'
  | 'updatedAt'
>;


/*
 * Immutable snapshot placed on a completed offer version
 * so the exact generated agreement remains identifiable.
 */
export interface OfferVersionDocumentSnapshot {
  documentUid: string;

  type: OfferDocumentType;

  title: string;
  fileName: string;
  storagePath: string;

  hash: OfferDocumentHash;

  template:
    OfferDocumentTemplateReference;

  generatedAt: Date;

  signatureRequestStatus:
    OfferSignatureRequestStatus;

  fullySigned: boolean;
  signedAt?: Date;

  downloadable: boolean;
  printable: boolean;
}