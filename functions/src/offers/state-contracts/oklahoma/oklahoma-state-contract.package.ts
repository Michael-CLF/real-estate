import type { StateContractPackage } from '../state-contract-package';
import { createOklahomaContractMilestones } from './oklahoma-contract-milestones';
import { sanitizeOklahomaDraftTerms } from './oklahoma-draft-terms-sanitizer';
import { createOklahomaInitialOfferTerms } from './oklahoma-initial-terms';
import { generateOklahomaOfferPdf } from './oklahoma-offer-pdf.service';
import type { OklahomaOfferTermsDocument } from './oklahoma-offer-terms.document';
import { validateOklahomaSubmission } from './oklahoma-submission-validator';
import { OREC_RESIDENTIAL_SALE_TEMPLATE } from './contracts/residential-sale/orec-residential-sale-template';

export const oklahomaStateContractPackage: StateContractPackage<OklahomaOfferTermsDocument> = {
  stateCode: 'OK',
  // Keep new public offers gated until selected OREC supplements and the
  // Oklahoma seller-disclosure packet are appended and lifecycle-tested.
  offerCreationEnabled: true,
  contractTypes: [OREC_RESIDENTIAL_SALE_TEMPLATE.contractType],
  contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: {
    stateCode: 'OK',
    templateUid: 'orec-residential-sale-2026',
    templateName: OREC_RESIDENTIAL_SALE_TEMPLATE.formName,
    templateVersion: OREC_RESIDENTIAL_SALE_TEMPLATE.templateVersion,
  },
  createInitialOfferTerms: input => createOklahomaInitialOfferTerms(input),
  generateAgreement: input => generateOklahomaOfferPdf(input),
  validateSubmission: input => validateOklahomaSubmission(input),
  sanitizeDraftTerms: input => sanitizeOklahomaDraftTerms(input),
  createContractMilestones: input => createOklahomaContractMilestones(input),
};
