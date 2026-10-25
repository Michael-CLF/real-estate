import type { FloridaOfferTerms } from '../../../../core/domains/offers/state-contracts/florida/models/florida-offer-terms.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { StateDocumentReview } from '../../engine/models/state-document-review';
/** State-owned behavior moved unchanged from the wizard. */
export const STATE_DOCUMENT_REVIEW: StateDocumentReview<FloridaOfferTerms> = {
    validate(terms, documents) {
        const attached = new Set(documents.map(document => document.documentType));
        const missing: OfferValidationIssue[] = [];
        for (const [status, path, documentType, label] of [
            [terms.disclosures.leadPaintStatus, 'disclosures.leadPaintStatus', 'lead-based-paint', 'signed lead disclosure packet'],
            [terms.disclosures.propertyConditionStatus, 'disclosures.propertyConditionStatus', 'florida-seller-property-disclosure', 'seller-signed Florida property condition statement'],
            [terms.disclosures.floodStatus, 'disclosures.floodStatus', 'florida-flood-disclosure', 'seller-signed statutory flood disclosure'],
            [terms.disclosures.hoaDocumentsStatus, 'disclosures.hoaDocumentsStatus', 'florida-hoa-disclosure-summary', 'seller-provided HOA disclosure summary'],
        ] as const) {
            if (status === 'received' && !attached.has(documentType))
                missing.push({ fieldPath: path, severity: 'error', message: `The seller must upload the ${label} to the listing before it can be marked received.` });
        }
        return missing;
    },
    applyChange(currentTerms, updatedTerms, change, documents, initiatedBy) {
        return updatedTerms;
    },
};
