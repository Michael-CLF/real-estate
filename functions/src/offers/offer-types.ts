import {
  Timestamp,
} from 'firebase-admin/firestore';


export type OfferStatus =
  | 'draft'
  | 'submitted'
  | 'viewed'
  | 'countered'
  | 'declined'
  | 'withdrawn'
  | 'expired'
  | 'closed_due_to_contract'
  | 'converted_to_contract';


export type OfferVersionStatus =
  | 'draft'
  | 'awaiting_signatures'
  | 'partially_signed'
  | 'signed'
  | 'delivered'
  | 'accepted'
  | 'declined'
  | 'withdrawn'
  | 'expired'
  | 'superseded';


export type OfferInitiatingParty =
  | 'buyer'
  | 'seller';


export type OfferResponseAction =
  | 'accept'
  | 'counter'
  | 'decline'
  | 'withdraw';


export type ContractStatus =
  | 'awaiting_signatures'
  | 'effective'
  | 'terminated'
  | 'closed';


export type TransactionPhase =
  | 'contract_formation'
  | 'due_diligence'
  | 'pending_closing'
  | 'terminated'
  | 'closed';


export interface CreateOfferDraftData {
  listingUid: string;
}


export interface CreateOfferDraftResponse {
  offerUid: string;
  offerVersionUid: string;

  referenceNumber: string;

  resumedExistingDraft: boolean;
}


export interface SaveOfferDraftData {
  offerUid: string;
  offerVersionUid: string;

  changes: Record<string, unknown>;
}


export interface SaveOfferDraftResponse {
  success: true;
}


export interface SubmitOfferData {
  offerUid: string;
  offerVersionUid: string;
}


export interface SubmitOfferResponse {
  success: true;
}


export interface CreateCounterofferData {
  offerUid: string;
  sourceVersionUid: string;
}


export interface CreateCounterofferResponse {
  offerUid: string;

  offerVersionUid: string;
  offerVersionNumber: number;
}


export interface RespondToOfferData {
  offerUid: string;
  offerVersionUid: string;

  action: OfferResponseAction;

  note?: string;
}


export interface RespondToOfferResponse {
  offerUid: string;
  offerVersionUid: string;

  action: OfferResponseAction;

  offerStatus: OfferStatus;

  contractUid?: string;

  listingStatusChanged: boolean;
}


export interface WithdrawOfferData {
  offerUid: string;
  offerVersionUid: string;
}


export interface WithdrawOfferResponse {
  success: true;
}


/*
 * Published-listing information trusted by the backend.
 */
export interface OfferEligibleListing {
  Uid: string;
  sellerUid: string;

  status: string;

  acceptingOffers: boolean;

  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  zipCode: string;
  county: string;

  parcelIdentificationNumber?: string;
  deedBook?: string;
  deedPage?: string;
  legalDescription?: string;

  propertyType: string;

  listPrice: number;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}


/*
 * User profile information used to create an offer party.
 */
export interface OfferUserProfile {
  uid: string;

  firstName: string;
  lastName: string;

  email: string;
  phone: string;

  addressLine1?: string;
  addressLine2?: string;

  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;

  identityStatus?: string;

  stripeIdentityVerificationSessionId?:
    string;

  verifiedFirstName?: string;
  verifiedMiddleName?: string;
  verifiedLastName?: string;

  identityVerifiedAt?: Timestamp;
}


/*
 * Immutable property snapshot copied into the offer.
 */
export interface OfferPropertySnapshotDocument {
  listingUid: string;

  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  zipCode: string;
  county: string;

  parcelIdentificationNumber?: string;

  deedBook?: string;
  deedPage?: string;

  legalDescription?: string;

  propertyType: string;

  listPriceInCents: number;
}


export interface OfferPartyAddressDocument {
  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  zipCode: string;
  country: string;
}


export interface OfferPartyDocument {
  Uid: string;

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

  userUid?: string;

  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;

  legalName: string;

  email: string;
  phone: string;

  mailingAddress:
    OfferPartyAddressDocument;

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

    verifiedAt?: Timestamp;

    legalNameApplied: boolean;
  };

  signature: {
    required: boolean;

    status:
      | 'not_invited'
      | 'invited'
      | 'viewed'
      | 'signed'
      | 'declined';

    providerEnvelopeUid?: string;
    providerSignerUid?: string;

    invitedAt?: Timestamp;
    viewedAt?: Timestamp;
    signedAt?: Timestamp;
    declinedAt?: Timestamp;
  };

  electronicTransactionsConsentAccepted:
    boolean;

  electronicTransactionsConsentAcceptedAt?:
    Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}


/*
 * Offer-thread document stored at:
 *
 * offers/{offerUid}
 */
export interface OfferDocument {
  Uid: string;

  referenceNumber: string;

  listingUid: string;
  stateCode: string;

  property:
    OfferPropertySnapshotDocument;

  primaryBuyerUid: string;
  buyerUids: string[];

  primarySellerUid: string;
  sellerUids: string[];

  status: OfferStatus;

  currentVersionUid: string;
  currentVersionNumber: number;

  initialVersionUid: string;
  versionUids: string[];

  totalVersions: number;

  contract?: {
    contractUid: string;

    acceptedOfferVersionUid: string;
    acceptedOfferVersionNumber: number;

    status: ContractStatus;
    transactionPhase: TransactionPhase;

    effectiveAt?: Timestamp;
    dueDiligenceEndsAt?: string;
    anticipatedClosingDate?: string;

    terminatedAt?: Timestamp;
    closedAt?: Timestamp;

    finalAgreementDocumentUid?: string;
  };

  statusHistory: OfferStatusHistoryDocument[];

  closedReason?:
    | 'declined'
    | 'withdrawn'
    | 'expired'
    | 'property_under_contract'
    | 'converted_to_contract';

  closedAt?: Timestamp;

  submittedAt?: Timestamp;
  firstViewedAt?: Timestamp;

  lastActivityAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface OfferStatusHistoryDocument {
  fromStatus?: OfferStatus;
  toStatus: OfferStatus;

  action:
    | 'draft_created'
    | 'draft_saved'
    | 'submitted'
    | 'viewed'
    | 'countered'
    | 'accepted'
    | 'declined'
    | 'withdrawn'
    | 'expired'
    | 'closed_due_to_contract'
    | 'converted_to_contract';

  actorUid: string;

  actorRole:
    | 'buyer'
    | 'seller'
    | 'system'
    | 'administrator';

  offerVersionUid?: string;
  offerVersionNumber?: number;

  note?: string;

  occurredAt: Timestamp;
}


/*
 * Offer-version document stored at:
 *
 * offers/{offerUid}/versions/{offerVersionUid}
 */
export interface OfferVersionDocument {
  Uid: string;

  offerUid: string;

  versionNumber: number;

  parentVersionUid?: string;

  initiatedBy:
    OfferInitiatingParty;

  initiatedByUid: string;

  status:
    OfferVersionStatus;

  stateCode: string;

  terms: Record<string, unknown>;

  buyers:
    OfferVersionPartySnapshotDocument[];

  sellers:
    OfferVersionPartySnapshotDocument[];

  changesFromPreviousVersion:
    OfferVersionChangeDocument[];

  documents:
    Record<string, unknown>[];

  statusHistory:
    OfferVersionStatusHistoryDocument[];

  immutable: boolean;

  lockedAt?: Timestamp;
  lockedByUid?: string;

  expiresAt: string;

  submittedAt?: Timestamp;
  firstViewedAt?: Timestamp;
  fullySignedAt?: Timestamp;
  deliveredAt?: Timestamp;
  acceptedAt?: Timestamp;
  declinedAt?: Timestamp;
  withdrawnAt?: Timestamp;
  expiredAt?: Timestamp;
  supersededAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}


export interface OfferVersionPartySnapshotDocument {
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

    verifiedAt?: Timestamp;

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

    invitedAt?: Timestamp;
    viewedAt?: Timestamp;
    signedAt?: Timestamp;
    declinedAt?: Timestamp;
  };

  electronicTransactionsConsentAccepted:
    boolean;

  electronicTransactionsConsentAcceptedAt?:
    Timestamp;
}


export interface OfferVersionChangeDocument {
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

  changedAt: Timestamp;
}


export interface OfferVersionStatusHistoryDocument {
  fromStatus?: OfferVersionStatus;

  toStatus:
    OfferVersionStatus;

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

  occurredAt: Timestamp;
}