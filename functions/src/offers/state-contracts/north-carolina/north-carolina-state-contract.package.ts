import { summaryFunding, summaryMoney, summaryText } from '../navstreet-pdf-layout';
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

      getAgreementSummary: ({ version: { terms: t } }) => [
    ...summaryFunding(t.purchase.purchasePriceInCents, undefined, t.purchase.financingType === 'cash'),
    { label: 'Funding', value: summaryText(t.purchase.financingType) },
    { label: 'Earnest money deposit', value: summaryMoney(t.deposits.depositInCents) },
    { label: 'Closing / settlement date', value: summaryText(t.settlement.settlementDate) },
    { label: 'Due diligence deadline', value: t.deposits.dueDiligenceDeadlineType === 'specific_date'
      ? `${summaryText(t.deposits.dueDiligenceEndDate)} at 5:00 p.m. Eastern`
      : `${summaryText(t.deposits.dueDiligenceDaysAfterEffectiveDate)} days after Effective Date, at 5:00 p.m. Eastern` },
  ],
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
