import type { SouthCarolinaOfferTerms } from '../../../../core/domains/offers/state-contracts/south-carolina/models/south-carolina-offer-terms.model';
import type { OfferValidationIssue } from '../../../../core/domains/offers/models/offer-validation.model';
import type { StateDocumentReview } from '../../engine/models/state-document-review';
/** State-owned behavior moved unchanged from the wizard. */
export const STATE_DOCUMENT_REVIEW: StateDocumentReview<SouthCarolinaOfferTerms> = {
    validate(terms, documents) {
        const attached = new Set(documents.map(document => document.documentType));
        const missing: OfferValidationIssue[] = [];
        for (const [status, path, documentType, label] of [
            [
                terms.disclosures.propertyConditionStatus,
                'disclosures.propertyConditionStatus',
                'south-carolina-property-condition',
                'property condition statement',
            ],
            [
                terms.disclosures.hoaDocumentsStatus,
                'disclosures.hoaDocumentsStatus',
                'south-carolina-association-documents',
                'association documents',
            ],
            [
                terms.disclosures.leadPaintStatus,
                'disclosures.leadPaintStatus',
                'lead-based-paint',
                'federal lead packet',
            ],
        ] as const) {
            if (status === 'received' &&
                (!attached.has(documentType) ||
                    !terms.documentVersions[documentType])) {
                missing.push({
                    fieldPath: path,
                    severity: 'error',
                    message: `The seller must upload the ${label} to the listing before it can be marked received.`,
                });
            }
        }
        return missing;
    },
    applyChange(currentTerms, updatedTerms, change, documents, initiatedBy) {
        const receiptTypes: Record<string, string> = {
            propertyConditionStatus: 'south-carolina-transfer-disclosure',
            naturalHazardStatus: 'south-carolina-natural-hazard-disclosure',
            fireHardeningStatus: 'south-carolina-fire-hardening',
            defensibleSpaceStatus: 'south-carolina-defensible-space',
            renovationStatus: 'south-carolina-recent-renovations',
            waterTankStatus: 'south-carolina-assisted-water-tank',
            hoaDocumentsStatus: 'south-carolina-association-documents',
            leadPaintStatus: 'lead-based-paint',
        };
        const type = receiptTypes[change.fieldPath.replace('disclosures.', '')];
        const versions = {
            ...updatedTerms.documentVersions,
        };
        if (type) {
            const document = documents.find(item => item.documentType === type);
            if (change.value === 'received' &&
                document) {
                versions[type] = document.versionId;
            }
            else {
                delete versions[type];
            }
        }
        return ({
            ...updatedTerms,
            documentVersions: versions,
        });
    },
};
