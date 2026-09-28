import { HttpsError } from 'firebase-functions/v2/https';
import type { StateContractPackage } from '../state-contract-package';
import type { LouisianaOfferTermsDocument } from './louisiana-offer-terms.document';
import { LOUISIANA_DOCUMENT_RULES } from './louisiana-document-rules';
import { createLouisianaInitialOfferTerms } from './louisiana-initial-terms';
import { sanitizeLouisianaDraftTerms } from './louisiana-draft-terms-sanitizer';
import { validateLouisianaSubmission } from './louisiana-submission-validator';
import { createLouisianaContractMilestones } from './louisiana-contract-milestones';
import { generateLouisianaOfferPdf } from './louisiana-offer-pdf.service';

export const louisianaStateContractPackage: StateContractPackage<LouisianaOfferTermsDocument> = {
  stateCode: 'LA', offerCreationEnabled: true,
  contractTypes: ['lrec_louisiana_residential_agreement_2026'], contractTypeRequired: true,
  defaultTimeZone: 'America/Chicago',
  agreementTemplate: {
    stateCode: 'LA', templateUid: LOUISIANA_DOCUMENT_RULES.templateUid,
    templateName: 'Louisiana Residential Agreement to Buy or Sell (LREC Rev. 01/2026)',
    templateVersion: LOUISIANA_DOCUMENT_RULES.version,
  },
  createInitialOfferTerms: createLouisianaInitialOfferTerms,
  sanitizeDraftTerms: sanitizeLouisianaDraftTerms,
  validateSubmission: validateLouisianaSubmission,
  validateBeforeSigning: ({ version }) => {
    if (
      version.terms.disclosures.propertyDisclosureStatus !== 'received' ||
      version.terms.disclosures.leadPaintStatus === 'pending'
    ) {
      throw new HttpsError(
        'failed-precondition',
        'The seller must upload the required disclosures and the buyer must acknowledge receipt before this Louisiana offer can be signed.'
      );
    }
  },
  requiredListingDisclosures: ({ version }) => [
    'louisiana-property-disclosure',
    ...(version.terms.disclosures.leadPaintStatus === 'received' ? ['lead-based-paint'] : []),
  ],
  createContractMilestones: createLouisianaContractMilestones,
  generateAgreement: generateLouisianaOfferPdf,
};