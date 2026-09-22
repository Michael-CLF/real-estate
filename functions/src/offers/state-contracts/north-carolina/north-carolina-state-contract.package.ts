import {
  createNorthCarolinaContractMilestones,
} from './north-carolina-contract-milestones';

import {
  sanitizeNorthCarolinaDraftTerms,
} from './north-carolina-draft-terms-sanitizer';

import {
  createNorthCarolinaInitialOfferTerms,
} from './north-carolina-initial-terms';

import {
  generateOfferPdf,
} from './north-carolina-offer-pdf.service';

import {
  validateNorthCarolinaSubmission,
} from './north-carolina-submission-validator';

import type {
  StateContractPackage,
} from '../state-contract-package';


const NORTH_CAROLINA_STATE_CODE =
  'NC';

const NORTH_CAROLINA_DEFAULT_TIME_ZONE =
  'America/New_York';


export const northCarolinaStateContractPackage:
  StateContractPackage = {
    stateCode:
      NORTH_CAROLINA_STATE_CODE,

    offerCreationEnabled: true,

    /*
     * North Carolina currently has one NavStreet contract
     * package, so callers must not select a contract type.
     */
    contractTypes: [],

    contractTypeRequired: false,

    defaultTimeZone:
      NORTH_CAROLINA_DEFAULT_TIME_ZONE,

    agreementTemplate: {
      stateCode:
        NORTH_CAROLINA_STATE_CODE,

      templateUid:
        'navstreet-nc-residential-purchase-agreement',

      templateName:
        'NavStreet North Carolina Residential Purchase Agreement',

      templateVersion:
        '1.0.0',
    },

    createInitialOfferTerms:
      input =>
        createNorthCarolinaInitialOfferTerms(
          input,
          {
            stateCode:
              NORTH_CAROLINA_STATE_CODE,

            defaultTimeZone:
              NORTH_CAROLINA_DEFAULT_TIME_ZONE,
          }
        ),

    generateAgreement:
      input =>
        generateOfferPdf(
          input
        ),

    validateSubmission:
      input =>
        validateNorthCarolinaSubmission(
          input,
          {
            stateCode:
              NORTH_CAROLINA_STATE_CODE,

            defaultTimeZone:
              NORTH_CAROLINA_DEFAULT_TIME_ZONE,
          }
        ),

    sanitizeDraftTerms:
      input =>
        sanitizeNorthCarolinaDraftTerms(
          input,
          {
            stateCode:
              NORTH_CAROLINA_STATE_CODE,

            defaultTimeZone:
              NORTH_CAROLINA_DEFAULT_TIME_ZONE,
          }
        ),

    createContractMilestones:
      input =>
        createNorthCarolinaContractMilestones(
          input
        ),
  };
