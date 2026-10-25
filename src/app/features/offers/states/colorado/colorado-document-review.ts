import type { ColoradoOfferTerms } from '../../../../core/domains/offers/state-contracts/colorado/models/colorado-offer-terms.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { StateDocumentReview } from '../../engine/models/state-document-review';
/** State-owned behavior moved unchanged from the wizard. */
export const STATE_DOCUMENT_REVIEW: StateDocumentReview<ColoradoOfferTerms> = {
    validate(terms, documents) {
        const attached = new Set(documents.map(document => document.documentType));
        const missing: OfferValidationIssue[] = [];
        if (terms.disclosures.sellerPropertyStatus === 'received' &&
            !attached.has('colorado-property-disclosure')) {
            missing.push({
                fieldPath: 'disclosures.sellerPropertyStatus',
                severity: 'error',
                message: 'The seller must upload the signed Colorado disclosure to this listing.',
            });
        }
        if (terms.disclosures.radonBrochureAcknowledged === true &&
            !attached.has('colorado-radon-brochure')) {
            missing.push({
                fieldPath: 'disclosures.radonBrochureAcknowledged',
                severity: 'error',
                message: 'The seller must upload the Colorado radon brochure to this listing.',
            });
        }
        if (terms.disclosures.leadPaintStatus === 'received' &&
            !attached.has('lead-based-paint')) {
            missing.push({
                fieldPath: 'disclosures.leadPaintStatus',
                severity: 'error',
                message: 'The seller must upload the signed lead disclosure packet.',
            });
        }
        return missing;
    },
    applyChange(currentTerms, updatedTerms, change, documents, initiatedBy) {
        return updatedTerms;
    },
};
