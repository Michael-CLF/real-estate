import {
  createTexasContractMilestones,
} from './texas-contract-milestones';

import {
  sanitizeTexasDraftTerms,
} from './texas-draft-terms-sanitizer';

import {
  createTexasInitialOfferTerms,
} from './texas-initial-terms';

import {
  generateTexasOfferPdf,
} from './texas-offer-pdf.service';

import {
  validateTexasSubmission,
} from './texas-submission-validator';

import type {
  StateContractPackage,
} from '../state-contract-package';

import type {
  TexasOneToFourFamilyResaleOfferTermsDocument,
} from './texas-offer-terms.document';

import {
  TREC_20_19_TEMPLATE,
} from './contracts/one-to-four-family-resale/trec-20-19-template';


const TEXAS_STATE_CODE = 'TX';

const TEXAS_DEFAULT_TIME_ZONE =
  'America/Chicago';


/*
 * Texas remains deliberately disabled until the complete production
 * flow and end-to-end tests pass. Including the package in the build
 * lets us compile and test it without making Texas available to users.
 */
export const texasStateContractPackage:
  StateContractPackage<
    TexasOneToFourFamilyResaleOfferTermsDocument
  > = {
  stateCode: TEXAS_STATE_CODE,

  offerCreationEnabled: true,

  contractTypes: [
    TREC_20_19_TEMPLATE.contractType,
  ],

  contractTypeRequired: true,

  defaultTimeZone:
    TEXAS_DEFAULT_TIME_ZONE,

  agreementTemplate: {
    stateCode: TEXAS_STATE_CODE,
    templateUid:
      'trec-20-19-one-to-four-family-resale',
    templateName:
      TREC_20_19_TEMPLATE.formName,
    templateVersion:
      TREC_20_19_TEMPLATE.templateVersion,
  },

  createInitialOfferTerms: input => {
    if (
      input.contractType !==
      TREC_20_19_TEMPLATE.contractType
    ) {
      throw new Error(
        'Texas currently supports only the TREC 20-19 One to Four Family Residential Contract (Resale).'
      );
    }

    return createTexasInitialOfferTerms(
      input,
      {}
    );
  },

  generateAgreement: input =>
    generateTexasOfferPdf(input),

  validateSubmission: input =>
    validateTexasSubmission(input),

  sanitizeDraftTerms: input =>
    sanitizeTexasDraftTerms(input),

  createContractMilestones: input =>
    createTexasContractMilestones(input),
};
