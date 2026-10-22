import type {
  StateOfferTerms,
} from '../../../../core/domains/offers/models/offer-terms.model';

export interface DisplayField {
  readonly label: string;
  readonly value: string;
}

/**
 * Values shared pages and cards can display without inspecting
 * state-specific contract terms.
 */
export interface OfferDisplayFields {
  readonly agreementTitle: string;
  readonly documentLabel: string;
  readonly purchasePriceInCents: number;
  readonly fundingLabel: string;
  readonly depositLabel: string;
  readonly depositInCents: number;
  readonly depositDelivery: DisplayField;
  readonly escrowAgent: string;
  readonly importantDeadline: DisplayField;
  readonly closingDate: DisplayField;
  readonly possessionLabel: string;
  /** Existing immutable versions that cannot proceed to signature. */
  readonly signingBlockReason?: string;
  /** Acceptance prerequisites that do not block buyer signatures. */
  readonly sellerSigningBlockReason?: string;
  readonly buyerSigningBlockReason?: string;
  readonly buyerWithdrawalEndsAt?: string;
}

export interface OfferDisplayContext { readonly offer?: unknown; readonly version?: unknown; }

export interface StateOfferDisplayAdapter<
  TTerms extends StateOfferTerms = StateOfferTerms
> {
  readonly stateCode: TTerms['stateCode'];

  display(
    terms: TTerms,
    context?: OfferDisplayContext
  ): OfferDisplayFields;
}