import {
  Offer,
  OfferSearchFilters,
  OfferSummary
} from '../models/offer.model';

import {
  OfferResponseAction
} from '../models/offer-status.model';

import {
  OfferVersion,
  OfferVersionDraftChanges
} from '../models/offer-version.model';


/*
 * Request used to save changes to an editable draft
 * version.
 */
export interface SaveOfferDraftRequest {
  offerUid: string;
  offerVersionUid: string;

  changes: OfferVersionDraftChanges;
}


/*
 * Request used when the buyer submits the first offer or a
 * party submits a counteroffer for signature and delivery.
 */
export interface SubmitOfferVersionRequest {
  offerUid: string;
  offerVersionUid: string;
}


/*
 * Request used to create a counteroffer from an existing
 * immutable version.
 */
export interface CreateCounterofferRequest {
  offerUid: string;
  sourceVersionUid: string;
}


/*
 * Result returned after creating a counteroffer version.
 */
export interface CreateCounterofferResult {
  offerUid: string;

  offerVersionUid: string;
  offerVersionNumber: number;
}


/*
 * Request used when a buyer or seller responds to the
 * current offer version.
 */
export interface RespondToOfferRequest {
  offerUid: string;
  offerVersionUid: string;

  action: OfferResponseAction;

  note?: string;
}


/*
 * Result returned after responding to an offer.
 */
export interface RespondToOfferResult {
  offerUid: string;
  offerVersionUid: string;

  action: OfferResponseAction;

  offerStatus: string;

  contractUid?: string;

  listingStatusChanged: boolean;
}


/*
 * Abstract persistence contract for the complete offer
 * lifecycle.
 *
 * Components and services depend on this abstraction rather
 * than importing Firestore directly.
 */
export abstract class OfferRepository {

  /*
   * OFFER THREADS
   */

  abstract getOfferByUid(
    offerUid: string
  ): Promise<Offer | null>;


  abstract getOfferByReferenceNumber(
    referenceNumber: string
  ): Promise<Offer | null>;


  abstract getOpenOfferForBuyerAndListing(
    buyerUid: string,
    listingUid: string
  ): Promise<Offer | null>;


  abstract getOffersForUser(
    userUid: string,
    filters: OfferSearchFilters
  ): Promise<OfferSummary[]>;


  abstract getOffersForListing(
    listingUid: string
  ): Promise<OfferSummary[]>;


  /*
   * OFFER VERSIONS
   */

  abstract getOfferVersionByUid(
    offerUid: string,
    offerVersionUid: string
  ): Promise<OfferVersion | null>;


  abstract getCurrentOfferVersion(
    offerUid: string
  ): Promise<OfferVersion | null>;


  abstract getOfferVersions(
    offerUid: string
  ): Promise<OfferVersion[]>;


  /*
   * DRAFT OPERATIONS
   *
   * Draft creation and all legally significant transitions
   * are performed by secure callable Functions. The browser
   * repository does not directly create offer records.
   */

  abstract createOrResumeOfferDraft(
    listingUid: string
  ): Promise<{
    offerUid: string;
    offerVersionUid: string;
    referenceNumber: string;
    resumedExistingDraft: boolean;
  }>;


  abstract saveOfferDraft(
    request: SaveOfferDraftRequest
  ): Promise<void>;


  /*
   * SUBMISSION AND NEGOTIATION
   */

  abstract submitOfferVersion(
    request: SubmitOfferVersionRequest
  ): Promise<void>;


  abstract createCounteroffer(
    request: CreateCounterofferRequest
  ): Promise<CreateCounterofferResult>;


  abstract respondToOffer(
    request: RespondToOfferRequest
  ): Promise<RespondToOfferResult>;


  abstract withdrawOffer(
    offerUid: string,
    offerVersionUid: string
  ): Promise<void>;
}