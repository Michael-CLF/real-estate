import type { ListingDisclosureDocument } from '../../../../core/domains/disclosures/models/listing-disclosure-document.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { OfferFieldValueChange } from '../offer-wizard-shell/offer-wizard-shell.component';
import type { StateOfferPackage } from './state-offer-package';

/** The engine supplies context; each state owns receipt semantics and version pinning. */
export interface StateDocumentReview<TTerms> {
  validate(terms: TTerms, documents: readonly ListingDisclosureDocument[]): readonly OfferValidationIssue[];
  /** Optional entry-time hook: preserve the state workflow’s existing save boundary. */
  prepareDraft?(previous: TTerms, updated: TTerms, documents: readonly ListingDisclosureDocument[]): TTerms;
  applyChange(
    previous: TTerms,
    updated: TTerms,
    change: OfferFieldValueChange,
    documents: readonly ListingDisclosureDocument[],
    // Legacy TX/OK wizards do not expose the initiating role; their hook is a no-op.
    initiatedBy: 'buyer' | 'seller' | undefined,
  ): TTerms;
}

export function withStateDocumentReview<T extends { readonly stateCode: string }, C extends string>(
  statePackage: StateOfferPackage<T, C>,
  documentReview: StateDocumentReview<T>,
): StateOfferPackage<T, C> {
  return { ...statePackage, documentReview };
}
