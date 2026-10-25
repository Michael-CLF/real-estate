import type { TexasOfferTerms } from '../../../../core/domains/offers/state-contracts/texas/models/texas-offer-terms.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { StateDocumentReview } from '../../engine/models/state-document-review';
/** State-owned behavior moved unchanged from the wizard. */
export const STATE_DOCUMENT_REVIEW: StateDocumentReview<TexasOfferTerms> = {
    validate(terms, documents) {
        return [];
    },
    applyChange(currentTerms, updatedTerms, change, documents, initiatedBy) {
        return updatedTerms;
    },
};
