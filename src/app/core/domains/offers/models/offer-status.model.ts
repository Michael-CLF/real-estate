/*
 * Represents the overall lifecycle of an offer thread.
 *
 * One offer thread belongs to one buyer and one listing.
 * Counteroffers create immutable versions inside the same
 * thread rather than creating unrelated offers.
 */
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


/*
 * Represents the lifecycle of one immutable offer or
 * counteroffer version.
 */
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


/*
 * Identifies which party created a particular offer version.
 */
export type OfferInitiatingParty =
  | 'buyer'
  | 'seller';


/*
 * Actions a buyer or seller may take in response to an
 * offer or counteroffer.
 */
export type OfferResponseAction =
  | 'accept'
  | 'counter'
  | 'decline'
  | 'withdraw';


/*
 * Lifecycle of the resulting purchase agreement.
 *
 * A contract exists separately from the offer thread once
 * all required parties have signed the same final version
 * and acceptance has been delivered.
 */
export type ContractStatus =
  | 'awaiting_signatures'
  | 'effective'
  | 'terminated'
  | 'closed';


/*
 * Private transaction stage displayed to the participating
 * buyer and seller.
 *
 * These phases are separate from the public listing status.
 */
export type TransactionPhase =
  | 'contract_formation'
  | 'due_diligence'
  | 'pending_closing'
  | 'terminated'
  | 'closed';


/*
 * Signature state for an individual required signer.
 */
export type OfferSignerStatus =
  | 'not_invited'
  | 'invited'
  | 'viewed'
  | 'signed'
  | 'declined';


/*
 * Electronic-signature provider lifecycle for the complete
 * document-signing process.
 */
export type OfferSignatureRequestStatus =
  | 'not_started'
  | 'preparing'
  | 'awaiting_signatures'
  | 'partially_signed'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'failed';


/*
 * Status of a generated PDF or other permanent offer
 * document.
 */
export type OfferDocumentStatus =
  | 'not_generated'
  | 'generating'
  | 'generated'
  | 'generation_failed';


/*
 * Identity-verification state for an offer participant.
 */
export type OfferIdentityStatus =
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'requires_input'
  | 'failed';


/*
 * Human-readable labels used throughout buyer and seller
 * interfaces.
 */
export const OFFER_STATUS_LABELS:
  Readonly<Record<OfferStatus, string>> = {
    draft: 'Draft',
    submitted: 'Submitted',
    viewed: 'Viewed by seller',
    countered: 'Counteroffer received',
    declined: 'Declined',
    withdrawn: 'Withdrawn',
    expired: 'Expired',
    closed_due_to_contract:
      'Closed — property under contract',
    converted_to_contract:
      'Accepted — contract effective'
  };


export const OFFER_VERSION_STATUS_LABELS:
  Readonly<Record<OfferVersionStatus, string>> = {
    draft: 'Draft',
    awaiting_signatures: 'Awaiting signatures',
    partially_signed: 'Partially signed',
    signed: 'Signed',
    delivered: 'Delivered',
    accepted: 'Accepted',
    declined: 'Declined',
    withdrawn: 'Withdrawn',
    expired: 'Expired',
    superseded: 'Superseded'
  };


export const CONTRACT_STATUS_LABELS:
  Readonly<Record<ContractStatus, string>> = {
    awaiting_signatures: 'Awaiting signatures',
    effective: 'Contract effective',
    terminated: 'Contract terminated',
    closed: 'Closed'
  };


export const TRANSACTION_PHASE_LABELS:
  Readonly<Record<TransactionPhase, string>> = {
    contract_formation: 'Contract formation',
    due_diligence: 'Due diligence',
    pending_closing: 'Pending closing',
    terminated: 'Terminated',
    closed: 'Closed'
  };