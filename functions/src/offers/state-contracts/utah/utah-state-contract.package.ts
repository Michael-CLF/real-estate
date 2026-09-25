import type { StateContractPackage } from '../state-contract-package';
import type { UtahOfferTermsDocument } from './utah-offer-terms.document';
import { UTAH_DOCUMENT_RULES } from './utah-document-rules';
import { createUtahInitialOfferTerms } from './utah-initial-terms';
import { sanitizeUtahDraftTerms } from './utah-draft-terms-sanitizer';
import { validateUtahSubmission } from './utah-submission-validator';
import { createUtahContractMilestones } from './utah-contract-milestones';
import { generateUtahOfferPdf } from './utah-offer-pdf.service';
export const utahStateContractPackage: StateContractPackage<UtahOfferTermsDocument> = {
  stateCode: 'UT', offerCreationEnabled: true,
  contractTypes: ['navstreet_utah_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Denver',
  agreementTemplate: { stateCode: 'UT', templateUid: UTAH_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Utah Residential Purchase and Sale Agreement', templateVersion: UTAH_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createUtahInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeUtahDraftTerms(input),
  validateSubmission: input => validateUtahSubmission(input),
  requiredListingDisclosures: input => {
    const t = input.version.terms;
    return [
      ...(t.disclosures.leadPaintStatus === 'received' ? ['lead-based-paint'] : []),
      ...(t.disclosures.propertyConditionStatus === 'received' ? ['utah-seller-property-condition'] : []),
      ...(t.disclosures.hoaDocumentsStatus === 'received' ? ['utah-hoa-governing-documents'] : []),
    ];
  },
  createContractMilestones: input => createUtahContractMilestones(input),
  generateAgreement: input => generateUtahOfferPdf(input),
};
