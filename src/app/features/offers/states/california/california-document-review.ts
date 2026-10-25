import type { CaliforniaOfferTerms } from '../../../../core/domains/offers/state-contracts/california/models/california-offer-terms.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { StateDocumentReview } from '../../engine/models/state-document-review';
/** State-owned behavior moved unchanged from the wizard. */
export const STATE_DOCUMENT_REVIEW: StateDocumentReview<CaliforniaOfferTerms> = {
    validate(terms, documents) {
        const attached = new Set(documents.map(document => document.documentType));
        const missing: OfferValidationIssue[] = [];
        for (const [status, path, documentType, label] of [
            [terms.disclosures.propertyConditionStatus, 'disclosures.propertyConditionStatus', 'california-transfer-disclosure', 'TDS'],
            [terms.disclosures.naturalHazardStatus, 'disclosures.naturalHazardStatus', 'california-natural-hazard-disclosure', 'NHD'],
            [terms.disclosures.fireHardeningStatus, 'disclosures.fireHardeningStatus', 'california-fire-hardening', 'fire-hardening disclosure'],
            [terms.disclosures.defensibleSpaceStatus, 'disclosures.defensibleSpaceStatus', 'california-defensible-space', 'defensible-space documentation'],
            [terms.disclosures.renovationStatus, 'disclosures.renovationStatus', 'california-recent-renovations', 'recent-renovation records'],
            [terms.disclosures.waterTankStatus, 'disclosures.waterTankStatus', 'california-assisted-water-tank', 'assisted water tank statement'],
            [terms.disclosures.hoaDocumentsStatus, 'disclosures.hoaDocumentsStatus', 'california-association-documents', 'association resale package'],
            [terms.disclosures.leadPaintStatus, 'disclosures.leadPaintStatus', 'lead-based-paint', 'federal lead packet'],
        ] as const) {
            if (status === 'received' && (!attached.has(documentType) || !terms.documentVersions[documentType]))
                missing.push({ fieldPath: path, severity: 'error', message: `The seller must upload the ${label} to the listing before it can be marked received.` });
        }
        return missing;
    },
    applyChange(currentTerms, updatedTerms, change, documents, initiatedBy) {
        const receiptTypes: Record<string, string> = {
            propertyConditionStatus: 'california-transfer-disclosure', naturalHazardStatus: 'california-natural-hazard-disclosure',
            fireHardeningStatus: 'california-fire-hardening', defensibleSpaceStatus: 'california-defensible-space',
            renovationStatus: 'california-recent-renovations', waterTankStatus: 'california-assisted-water-tank',
            hoaDocumentsStatus: 'california-association-documents', leadPaintStatus: 'lead-based-paint',
        };
        const type = receiptTypes[change.fieldPath.replace('disclosures.', '')];
        const versions = { ...updatedTerms.documentVersions };
        if (type) {
            const document = documents.find(d => d.documentType === type);
            if (change.value === 'received' && document)
                versions[type] = document.versionId;
            else
                delete versions[type];
        }
        return ({ ...updatedTerms, documentVersions: versions });
    },
};
