import { pinMissouriReviewedDocumentVersions } from './services/missouri-reviewed-document-versions';
import type { MissouriOfferTerms } from '../../../../core/domains/offers/state-contracts/missouri/models/missouri-offer-terms.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { StateDocumentReview } from '../../engine/models/state-document-review';
/** State-owned behavior moved unchanged from the wizard. */
export const STATE_DOCUMENT_REVIEW: StateDocumentReview<MissouriOfferTerms> = {
    validate(terms, documents) {
        const attached = new Set(documents.map(document => document.documentType));
        const missing: OfferValidationIssue[] = [];
        for (const [status, path, documentType, label] of [
            [terms.disclosures.leadPaintStatus, 'disclosures.leadPaintStatus', 'lead-based-paint', 'signed lead disclosure packet'],
            [terms.disclosures.propertyConditionStatus, 'disclosures.propertyConditionStatus', 'missouri-seller-disclosure', 'seller-signed Missouri property condition statement'],
            [terms.disclosures.statutoryPacketStatus, 'disclosures.statutoryPacketStatus', 'missouri-statutory-packet', 'seller-signed statutory property-specific statutory disclosure packet'],
            [terms.disclosures.hoaDocumentsStatus, 'disclosures.hoaDocumentsStatus', 'missouri-association-documents', 'seller-provided association resale packet'],
        ] as const) {
            if (terms.contractType === 'navstreet_missouri_condominium_resale_2026' && documentType === 'missouri-association-documents')
                continue;
            if ((status === 'received' || status === 'exempt') && !attached.has(documentType))
                missing.push({ fieldPath: path, severity: 'error', message: `The seller must upload the ${label} to the listing before it can be marked received.` });
        }
        if (terms.specialProperty?.resaleCertificateStatus === 'received' && !attached.has('missouri-condominium-resale-certificate'))
            missing.push({ fieldPath: 'specialProperty.resaleCertificateStatus', severity: 'error', message: 'The recorded condominium receipt requires the seller-uploaded resale certificate.' });
        return missing;
    },
    prepareDraft: pinMissouriReviewedDocumentVersions,
    applyChange(currentTerms, updatedTerms, change, documents, initiatedBy) {
        return updatedTerms;
    },
};
