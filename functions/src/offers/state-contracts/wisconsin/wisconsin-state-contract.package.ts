import type { StateContractPackage } from '../state-contract-package';
import type { WisconsinOfferTermsDocument } from './wisconsin-offer-terms.document';
import { WISCONSIN_DOCUMENT_RULES } from './wisconsin-document-rules';
import { createWisconsinInitialOfferTerms } from './wisconsin-initial-terms';
import { sanitizeWisconsinDraftTerms } from './wisconsin-draft-terms-sanitizer';
import { validateWisconsinSubmission } from './wisconsin-submission-validator';
import { createWisconsinContractMilestones } from './wisconsin-contract-milestones';
import { generateWisconsinOfferPdf } from './wisconsin-offer-pdf.service';
export const wisconsinStateContractPackage: StateContractPackage<WisconsinOfferTermsDocument> = {
  stateCode: 'WI', offerCreationEnabled: true,
  contractTypes: ['navstreet_wisconsin_residential_sale_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: { stateCode: 'WI', templateUid: WISCONSIN_DOCUMENT_RULES.templateUid, templateName: 'NavStreet Wisconsin Residential Purchase and Sale Agreement', templateVersion: WISCONSIN_DOCUMENT_RULES.version },
  createInitialOfferTerms: input => createWisconsinInitialOfferTerms(input),
  sanitizeDraftTerms: input => sanitizeWisconsinDraftTerms(input),
  validateSubmission: input => validateWisconsinSubmission(input),
  requiredListingDisclosures: input => {
    const t = input.version.terms;
    return [
      ...(t.disclosures.leadPaintStatus === 'received' ? ['lead-based-paint'] : []),
      'wisconsin-real-estate-condition-report',
      ...(t.disclosures.hoaDocumentsStatus === 'received' ? ['wisconsin-association-documents'] : []),
    ];
  },
  createContractMilestones: input => createWisconsinContractMilestones(input),
  generateAgreement: input => generateWisconsinOfferPdf(input),
};
