import type { ConnecticutOfferTerms } from '../../../../core/domains/offers/state-contracts/connecticut/models/connecticut-offer-terms.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { StateDocumentReview } from '../../engine/models/state-document-review';
/** State-owned behavior moved unchanged from the wizard. */
export const STATE_DOCUMENT_REVIEW: StateDocumentReview<ConnecticutOfferTerms> = {
    validate(terms, documents) {
        const attached = new Set(documents.map(document => document.documentType));
        const missing: OfferValidationIssue[] = [];
        for (const [status, path, documentType, label] of [
            [terms.disclosures.leadPaintStatus, 'disclosures.leadPaintStatus', 'lead-based-paint', 'signed lead disclosure packet'],
            [terms.disclosures.propertyConditionStatus, 'disclosures.propertyConditionStatus', 'connecticut-seller-disclosure', 'seller-signed Connecticut property condition statement'],
            [terms.disclosures.statutoryPacketStatus, 'disclosures.statutoryPacketStatus', 'connecticut-statutory-packet', 'seller-signed statutory property-specific statutory disclosure packet'],
            [terms.disclosures.hoaDocumentsStatus, 'disclosures.hoaDocumentsStatus', 'connecticut-association-documents', 'seller-provided association resale packet'],
        ] as const) {
            if (status === 'received' || status === 'exempt') {
                if (!attached.has(documentType))
                    missing.push({ fieldPath: path, severity: 'error', message: `The seller must upload the ${label} before it can be marked received.` });
                else if (terms.documentVersions !== undefined && !terms.documentVersions[documentType])
                    missing.push({ fieldPath: path, severity: 'error', message: 'Review the uploaded document and select its receipt status again to record the exact version.' });
            }
        }
        return missing;
    },
    applyChange(currentTerms, updatedTerms, change, documents, initiatedBy) {
        const receiptTypes: Record<string, string> = { 'disclosures.propertyConditionStatus': 'connecticut-seller-disclosure', 'disclosures.statutoryPacketStatus': 'connecticut-statutory-packet', 'disclosures.hoaDocumentsStatus': 'connecticut-association-documents', 'disclosures.leadPaintStatus': 'lead-based-paint' };
        const documentType = receiptTypes[change.fieldPath];
        if (documentType && initiatedBy === 'buyer') {
            const pins = { ...currentTerms.documentVersions };
            const document = documents.find(row => row.documentType === documentType);
            if ((change.value === 'received' || change.value === 'exempt') && document?.versionId)
                pins[documentType] = document.versionId;
            else
                delete pins[documentType];
            return ({ ...updatedTerms, documentVersions: pins });
        }
        else {
            return (updatedTerms);
        }
    },
};
