import type { WashingtonOfferTerms } from '../../../../core/domains/offers/state-contracts/washington/models/washington-offer-terms.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { StateDocumentReview } from '../../engine/models/state-document-review';
import { pinWashingtonReviewedDocumentVersions } from './services/washington-reviewed-document-versions';
/** State-owned behavior moved unchanged from the wizard. */
export const STATE_DOCUMENT_REVIEW: StateDocumentReview<WashingtonOfferTerms> = {
    validate(terms, documents) {
        const attached = new Set(documents.map(document => document.documentType));
        const missing: OfferValidationIssue[] = [];
        for (const [status, path, documentType, label] of [
            [terms.disclosures.leadPaintStatus, 'disclosures.leadPaintStatus', 'lead-based-paint', 'signed lead disclosure packet'],
            [terms.disclosures.propertyConditionStatus, 'disclosures.propertyConditionStatus', 'washington-seller-disclosure', 'seller-signed Washington property condition statement'],
            [terms.disclosures.statutoryPacketStatus, 'disclosures.statutoryPacketStatus', 'washington-statutory-packet', 'seller-signed statutory property-specific statutory disclosure packet'],
            [terms.disclosures.hoaDocumentsStatus, 'disclosures.hoaDocumentsStatus', 'washington-association-documents', 'seller-provided association resale packet'],
        ] as const) {
            if ((status === 'received' || status === 'exempt') && !attached.has(documentType))
                missing.push({ fieldPath: path, severity: 'error', message: `The seller must upload the ${label} to the listing before it can be marked received.` });
        }
        return missing;
    },
    applyChange(currentTerms, updatedTerms, change, documents, initiatedBy) {
        return initiatedBy === 'buyer' ? pinWashingtonReviewedDocumentVersions(currentTerms, updatedTerms, documents) : updatedTerms;
    },
};
