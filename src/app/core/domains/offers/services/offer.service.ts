import {
  Injectable,
  inject
} from '@angular/core';

import {
  AuthState
} from '../../../authentication/state/auth.state';

import {
  CreateOfferDraftResult,
  Offer,
  OfferSearchFilters,
  OfferSummary
} from '../models/offer.model';

import {
  OfferParty
} from '../models/offer-party.model';

import {
  OfferResponseAction
} from '../models/offer-status.model';

import {
  OfferTerms
} from '../models/offer-terms.model';

import {
  OfferVersion,
  OfferVersionDraftChanges
} from '../models/offer-version.model';

import {
  FirestoreOfferRepository
} from '../repositories/firestore-offer.repository';

import {
  CreateCounterofferResult,
  RespondToOfferResult
} from '../repositories/offer.repository';

import {
  OfferValidationContext,
  OfferValidationResult,
  OfferValidationService
} from './offer-validation.service';


export interface OfferParticipantAccess {
  userUid: string;

  isBuyer: boolean;
  isSeller: boolean;

  canView: boolean;
  canEditCurrentDraft: boolean;
  canSubmitCurrentVersion: boolean;
  canCounter: boolean;
  canAccept: boolean;
  canDecline: boolean;
  canWithdraw: boolean;
}


@Injectable({
  providedIn: 'root'
})
export class OfferService {

  private readonly authState =
    inject(AuthState);

  private readonly offerRepository =
    inject(FirestoreOfferRepository);

  private readonly validationService =
    inject(OfferValidationService);


  get currentUserUid(): string {
    const userUid =
      this.authState.uid();

    if (!userUid) {
      throw new Error(
        'An authenticated user is required.'
      );
    }

    return userUid;
  }


  async createOrResumeDraft(
    listingUid: string
  ): Promise<CreateOfferDraftResult> {
    this.requireText(
      listingUid,
      'A listing identifier is required.'
    );

    return this.offerRepository
      .createOrResumeOfferDraft(
        listingUid
      );
  }


  async getOffer(
    offerUid: string
  ): Promise<Offer | null> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    return this.offerRepository
      .getOfferByUid(
        offerUid
      );
  }


  async getOfferByReferenceNumber(
    referenceNumber: string
  ): Promise<Offer | null> {
    this.requireText(
      referenceNumber,
      'An offer reference number is required.'
    );

    return this.offerRepository
      .getOfferByReferenceNumber(
        referenceNumber.trim().toUpperCase()
      );
  }


  async getCurrentVersion(
    offerUid: string
  ): Promise<OfferVersion | null> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    return this.offerRepository
      .getCurrentOfferVersion(
        offerUid
      );
  }


  async getVersion(
    offerUid: string,
    offerVersionUid: string
  ): Promise<OfferVersion | null> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    this.requireText(
      offerVersionUid,
      'An offer-version identifier is required.'
    );

    return this.offerRepository
      .getOfferVersionByUid(
        offerUid,
        offerVersionUid
      );
  }


  async getVersionHistory(
    offerUid: string
  ): Promise<OfferVersion[]> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    return this.offerRepository
      .getOfferVersions(
        offerUid
      );
  }


  async getMyOffers(
    filters: OfferSearchFilters
  ): Promise<OfferSummary[]> {
    return this.offerRepository
      .getOffersForUser(
        this.currentUserUid,
        filters
      );
  }


  async getOffersForListing(
    listingUid: string
  ): Promise<OfferSummary[]> {
    this.requireText(
      listingUid,
      'A listing identifier is required.'
    );

    return this.offerRepository
      .getOffersForListing(
        listingUid
      );
  }


  validateDraft(
    terms: OfferTerms,
    buyers: OfferParty[],
    sellers: OfferParty[],
    context: OfferValidationContext = {
      mode: 'draft'
    }
  ): OfferValidationResult {
    return this.validationService.validate(
      terms,
      buyers,
      sellers,
      context
    );
  }


  async saveDraft(
    offerUid: string,
    offerVersionUid: string,
    changes: OfferVersionDraftChanges
  ): Promise<void> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    this.requireText(
      offerVersionUid,
      'An offer-version identifier is required.'
    );

    if (
      Object.keys(changes).length === 0
    ) {
      return;
    }

    await this.offerRepository
      .saveOfferDraft({
        offerUid,
        offerVersionUid,
        changes
      });
  }


  async submitVersion(
    offerUid: string,
    offerVersionUid: string
  ): Promise<void> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    this.requireText(
      offerVersionUid,
      'An offer-version identifier is required.'
    );

    /*
     * The backend repeats all eligibility and validation
     * checks. Client-side validation improves the user
     * experience but is never the final authority.
     */
    await this.offerRepository
      .submitOfferVersion({
        offerUid,
        offerVersionUid
      });
  }


  async createCounteroffer(
    offerUid: string,
    sourceVersionUid: string
  ): Promise<CreateCounterofferResult> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    this.requireText(
      sourceVersionUid,
      'A source offer-version identifier is required.'
    );

    return this.offerRepository
      .createCounteroffer({
        offerUid,
        sourceVersionUid
      });
  }


  async respondToOffer(
    offerUid: string,
    offerVersionUid: string,
    action: OfferResponseAction,
    note?: string
  ): Promise<RespondToOfferResult> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    this.requireText(
      offerVersionUid,
      'An offer-version identifier is required.'
    );

    return this.offerRepository
      .respondToOffer({
        offerUid,
        offerVersionUid,
        action,
        note: note?.trim() || undefined
      });
  }


  async acceptOffer(
    offerUid: string,
    offerVersionUid: string
  ): Promise<RespondToOfferResult> {
    return this.respondToOffer(
      offerUid,
      offerVersionUid,
      'accept'
    );
  }


  async declineOffer(
    offerUid: string,
    offerVersionUid: string,
    note?: string
  ): Promise<RespondToOfferResult> {
    return this.respondToOffer(
      offerUid,
      offerVersionUid,
      'decline',
      note
    );
  }


  async withdrawOffer(
    offerUid: string,
    offerVersionUid: string
  ): Promise<void> {
    this.requireText(
      offerUid,
      'An offer identifier is required.'
    );

    this.requireText(
      offerVersionUid,
      'An offer-version identifier is required.'
    );

    await this.offerRepository
      .withdrawOffer(
        offerUid,
        offerVersionUid
      );
  }


  getParticipantAccess(
    offer: Offer,
    version: OfferVersion
  ): OfferParticipantAccess {
    const userUid =
      this.currentUserUid;

    const isBuyer =
      offer.buyerUids.includes(
        userUid
      );

    const isSeller =
      offer.sellerUids.includes(
        userUid
      );

    const isInitiatingParty =
      (
        version.initiatedBy ===
          'buyer' &&
        isBuyer
      ) ||
      (
        version.initiatedBy ===
          'seller' &&
        isSeller
      );

    const isReceivingParty =
      (
        version.initiatedBy ===
          'buyer' &&
        isSeller
      ) ||
      (
        version.initiatedBy ===
          'seller' &&
        isBuyer
      );

    const actionableStatus =
      version.status === 'delivered' ||
      version.status === 'signed';

    return {
      userUid,

      isBuyer,
      isSeller,

      canView:
        isBuyer || isSeller,

      canEditCurrentDraft:
        version.status === 'draft' &&
        !version.immutable &&
        isInitiatingParty,

      canSubmitCurrentVersion:
        version.status === 'draft' &&
        !version.immutable &&
        isInitiatingParty,

      canCounter:
        actionableStatus &&
        isReceivingParty,

      canAccept:
        actionableStatus &&
        isReceivingParty,

      canDecline:
        actionableStatus &&
        isReceivingParty,

      canWithdraw:
        (
          offer.status === 'submitted' ||
          offer.status === 'viewed' ||
          offer.status === 'countered'
        ) &&
        isInitiatingParty
    };
  }


  private requireText(
    value: string,
    message: string
  ): void {
    if (
      typeof value !== 'string' ||
      value.trim().length === 0
    ) {
      throw new Error(message);
    }
  }
}