import type { NebraskaOfferTerms } from '../../../../core/domains/offers/state-contracts/nebraska/models/nebraska-offer-terms.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { StateDocumentReview } from '../../engine/models/state-document-review';
/** State-owned behavior moved unchanged from the wizard. */
export const STATE_DOCUMENT_REVIEW: StateDocumentReview<NebraskaOfferTerms> = {
    validate(terms, documents) {
        const attached = new Set(documents.map(document => document.documentType));
        const missing: OfferValidationIssue[] = [];
        for (const [status, path, documentType, label] of [
            [terms.disclosures.leadPaintStatus, 'disclosures.leadPaintStatus', 'lead-based-paint', 'signed lead disclosure packet'],
            [terms.disclosures.propertyConditionStatus, 'disclosures.propertyConditionStatus', 'nebraska-seller-disclosure', 'seller-signed Nebraska property condition statement'],
            [terms.disclosures.statutoryPacketStatus, 'disclosures.statutoryPacketStatus', 'nebraska-statutory-packet', 'seller-signed statutory property-specific statutory disclosure packet'],
            [terms.disclosures.hoaDocumentsStatus, 'disclosures.hoaDocumentsStatus', 'nebraska-association-documents', 'seller-provided association resale packet'],
        ] as const) {
            if ((status === 'received' || status === 'exempt') && !attached.has(documentType))
                missing.push({ fieldPath: path, severity: 'error', message: `The seller must upload the ${label} to the listing before it can be marked received.` });
        }
        return missing;
    },
    applyChange(currentTerms, updatedTerms, change, documents, initiatedBy) {
        return updatedTerms;
    },
};
