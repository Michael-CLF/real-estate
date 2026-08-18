import {
  OfferParty
} from './offer-party.model';

import {
  OfferTerms
} from './offer-terms.model';

import {
  OfferVersionDocumentSnapshot
} from './offer-document.model';

import {
  OfferInitiatingParty,
  OfferVersionStatus
} from './offer-status.model';


/*
 * Describes one field changed between an offer version and
 * the version immediately preceding it.
 */
export interface OfferVersionChange {
  fieldPath: string;

  label: string;

  previousValue:
    | string
    | number
    | boolean
    | null;

  newValue:
    | string
    | number
    | boolean
    | null;

  changedByParty:
    OfferInitiatingParty;

  changedByUid: string;

  changedAt: Date;
}


/*
 * Records one status transition for an offer version.
 */
export interface OfferVersionStatusHistoryEntry {
  fromStatus?: OfferVersionStatus;
  toStatus: OfferVersionStatus;

  action:
    | 'created'
    | 'saved'
    | 'submitted'
    | 'signature_requested'
    | 'partially_signed'
    | 'signed'
    | 'delivered'
    | 'viewed'
    | 'accepted'
    | 'declined'
    | 'withdrawn'
    | 'expired'
    | 'superseded';

  actorUid: string;

  actorRole:
    | 'buyer'
    | 'seller'
    | 'system'
    | 'administrator';

  note?: string;

  occurredAt: Date;
}


/*
 * Snapshot of one signer at the time an offer version is
 * created.
 *
 * The party record is copied into the version so later
 * profile changes cannot alter historical documents.
 */
/*
 * Complete party snapshot stored inside an offer version.
 *
 * Draft versions use this information to populate the
 * wizard. Submitted versions preserve it permanently so
 * later user-profile changes cannot alter offer history.
 */
export interface OfferVersionPartySnapshot {
  partyUid: string;
  userUid?: string;

  role:
    | 'buyer'
    | 'seller';

  capacity:
    | 'individual'
    | 'joint'
    | 'trust'
    | 'estate'
    | 'corporation'
    | 'limited_liability_company'
    | 'partnership'
    | 'other';

  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;

  legalName: string;

  email: string;
  phone: string;

  mailingAddress: {
    addressLine1: string;
    addressLine2?: string;

    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  sequence: number;
  primaryParty: boolean;

  intendedUse?:
    | 'primary_residence'
    | 'second_home'
    | 'investment_property'
    | 'other';

  proposedDeedName?: string;

  requiredSigner: boolean;

  identityVerification: {
    status:
      | 'not_started'
      | 'pending'
      | 'verified'
      | 'requires_input'
      | 'failed';

    provider: 'stripe_identity';

    providerVerificationUid?: string;

    verifiedFirstName?: string;
    verifiedMiddleName?: string;
    verifiedLastName?: string;

    verifiedAt?: Date;

    legalNameApplied: boolean;
  };

  signature: {
    status:
      | 'not_started'
      | 'invited'
      | 'viewed'
      | 'signed'
      | 'declined';

    providerEnvelopeUid?: string;
    providerSignerUid?: string;

    invitedAt?: Date;
    viewedAt?: Date;
    signedAt?: Date;
    declinedAt?: Date;
  };

  electronicTransactionsConsentAccepted:
    boolean;

  electronicTransactionsConsentAcceptedAt?:
    Date;
}


/*
 * Represents one immutable offer or counteroffer version.
 *
 * Draft versions may be edited until submitted for
 * signature. Once submitted, the version is frozen.
 */
export interface OfferVersion {
  Uid: string;

  offerUid: string;

  versionNumber: number;

  /*
   * Reference to the immediately preceding version.
   *
   * The first buyer offer has no parent version.
   */
  parentVersionUid?: string;

  initiatedBy:
    OfferInitiatingParty;

  initiatedByUid: string;

  status: OfferVersionStatus;

  stateCode: string;

  /*
   * Complete snapshot of all offer terms for this version.
   *
   * A counteroffer carries forward the previous terms and
   * then changes only the fields selected by the
   * countering party.
   */
  terms: OfferTerms;

  /*
   * Complete party snapshots for document generation.
   */
  buyers: OfferVersionPartySnapshot[];
  sellers: OfferVersionPartySnapshot[];

  /*
   * Differences from the immediately preceding version.
   */
  changesFromPreviousVersion:
    OfferVersionChange[];

  /*
   * Permanent PDF and signature-document references.
   */
  documents:
    OfferVersionDocumentSnapshot[];

  statusHistory:
    OfferVersionStatusHistoryEntry[];

  /*
   * Once true, no terms or parties may be edited.
   *
   * Any later change requires a new version.
   */
  immutable: boolean;
  lockedAt?: Date;
  lockedByUid?: string;

  /*
   * Version-level expiration copied from the terms so the
   * backend can evaluate expiration without reading deeply
   * nested data.
   */
  expiresAt: string;

  submittedAt?: Date;
  firstViewedAt?: Date;
  fullySignedAt?: Date;
  deliveredAt?: Date;
  acceptedAt?: Date;
  declinedAt?: Date;
  withdrawnAt?: Date;
  expiredAt?: Date;
  supersededAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}


/*
 * Information needed to create the first editable buyer
 * offer version.
 */
export interface InitialBuyerOfferVersion {
  offerUid: string;

  initiatedByUid: string;

  stateCode: string;

  terms: OfferTerms;

  buyers: OfferParty[];
  sellers: OfferParty[];

  expiresAt: string;
}


/*
 * Information needed to create a counteroffer version.
 */
export interface InitialCounterofferVersion {
  offerUid: string;

  parentVersionUid: string;

  initiatedBy:
    OfferInitiatingParty;

  initiatedByUid: string;

  stateCode: string;

  terms: OfferTerms;

  buyers: OfferParty[];
  sellers: OfferParty[];

  changesFromPreviousVersion:
    OfferVersionChange[];

  expiresAt: string;
}


/*
 * Restricted set of editable values for an existing draft.
 *
 * Submitted or immutable versions must never be updated
 * using this type.
 */
export type OfferVersionDraftChanges = Partial<
  Pick<
    OfferVersion,
    | 'terms'
    | 'buyers'
    | 'sellers'
    | 'expiresAt'
  >
>;