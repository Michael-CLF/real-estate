import type { LouisianaOfferTerms } from '../../../../core/domains/offers/state-contracts/louisiana/models/louisiana-offer-terms.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { StateDocumentReview } from '../../engine/models/state-document-review';
/** State-owned behavior moved unchanged from the wizard. */
export const STATE_DOCUMENT_REVIEW: StateDocumentReview<LouisianaOfferTerms> = {
    validate(terms, documents) {
        const attached = new Set(documents.map(document => document.documentType));
        const missing: OfferValidationIssue[] = [];
        if (terms.disclosures.propertyDisclosureStatus === 'received' && !attached.has('louisiana-property-disclosure')) {
            missing.push({ fieldPath: 'disclosures.propertyDisclosureStatus', severity: 'error', message: 'The seller must upload the signed Louisiana disclosure to this listing.' });
        }
        if (terms.disclosures.leadPaintStatus === 'received' && !attached.has('lead-based-paint')) {
            missing.push({ fieldPath: 'disclosures.leadPaintStatus', severity: 'error', message: 'The seller must upload the signed lead disclosure packet.' });
        }
        return missing;
    },
    applyChange(currentTerms, updatedTerms, change, documents, initiatedBy) {
        return updatedTerms;
    },
};
