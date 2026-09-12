import {
  ContractStatus,
  OfferStatus,
  OfferVersionStatus,
  TransactionPhase
} from './offer-status.model';

import {
  OfferPropertySnapshot
} from './offer-terms.model';


/*
 * Reason an offer thread can no longer receive another
 * response.
 */
export type OfferClosedReason =
  | 'declined'
  | 'withdrawn'
  | 'expired'
  | 'property_under_contract'
  | 'converted_to_contract';


/*
 * Records one lifecycle event for the complete offer
 * thread.
 */
export interface OfferStatusHistoryEntry {
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

  occurredAt: Date;
}


/*
 * Summary of the contract created from the final accepted
 * offer version.
 */
export interface OfferContractReference {
  contractUid: string;

  acceptedOfferVersionUid: string;
  acceptedOfferVersionNumber: number;

  status: ContractStatus;
  transactionPhase: TransactionPhase;

  effectiveAt?: Date;
  dueDiligenceEndsAt?: string;
  anticipatedClosingDate?: string;

  terminatedAt?: Date;
  closedAt?: Date;

  finalAgreementDocumentUid?: string;
}


/*
 * Represents one complete negotiation thread between one
 * buyer group and one seller group for one listing.
 *
 * Counteroffers are stored as versions inside this thread.
 */
export interface Offer {
  Uid: string;

  referenceNumber: string;

  listingUid: string;
  stateCode: string;

  /*
   * Snapshot captured when the initial offer draft is
   * created. Later listing edits do not alter this record.
   */
  property: OfferPropertySnapshot;

  /*
   * The authenticated user who initiated the offer.
   */
  primaryBuyerUid: string;

  /*
   * All authenticated buyers associated with the offer.
   */
  buyerUids: string[];

  /*
   * Published-listing owner and participating sellers.
   */
  primarySellerUid: string;
  sellerUids: string[];

  status: OfferStatus;

  /*
   * True while this complete offer transaction contributes
   * one unit to the listing's pending-offer count.
   */
  pendingOfferCounted?: boolean;

  /*
   * Current editable or actionable version.
   */
  currentVersionUid: string;
  currentVersionNumber: number;

  currentVersionInitiatedBy:
    | 'buyer'
    | 'seller';

  /*
   * Most recent version signed and sent to the receiving
   * party. The current version may still be a private draft.
   */
  lastDeliveredVersionUid?: string;

  /*
   * First buyer-created version.
   */
  initialVersionUid: string;

  /*
   * All version UIDs in chronological order.
   */
  versionUids: string[];

  totalVersions: number;

  contract?: OfferContractReference;

  statusHistory: OfferStatusHistoryEntry[];

  closedReason?: OfferClosedReason;
  closedAt?: Date;

  submittedAt?: Date;
  firstViewedAt?: Date;
  lastActivityAt: Date;

  createdAt: Date;
  updatedAt: Date;
}


/*
 * Data required to create a new offer thread.
 */
export interface CreateOfferDraftInput {
  listingUid: string;
}


/*
 * Response returned after creating or resuming a draft.
 */
export interface CreateOfferDraftResult {
  offerUid: string;
  offerVersionUid: string;

  referenceNumber: string;

  resumedExistingDraft: boolean;
}


/*
 * Data used by buyer and seller dashboards without loading
 * every version and complete set of terms.
 */
export interface OfferSummary {
  Uid: string;

  referenceNumber: string;

  listingUid: string;

  propertyAddress: string;
  stateCode: string;

  primaryBuyerName: string;
  primarySellerName: string;

  status: OfferStatus;

  currentVersionUid: string;
  currentVersionNumber: number;

  lastDeliveredVersionUid?: string;

  currentVersionInitiatedBy:
    | 'buyer'
    | 'seller';

  currentVersionSenderName: string;

  currentVersionStatus:
    OfferVersionStatus;

  purchasePriceInCents: number;

  expiresAt: string;

  submittedAt?: Date;
  lastActivityAt: Date;
}


/*
 * Filters used when loading offers for an authenticated
 * buyer or seller.
 */
export interface OfferSearchFilters {
  role:
    | 'buyer'
    | 'seller';

  statuses?: OfferStatus[];

  listingUid?: string;

  limit?: number;
}


/*
 * Complete offer thread with its ordered version UIDs.
 */
export interface OfferWithVersionUids {
  offer: Offer;
  orderedVersionUids: string[];
}