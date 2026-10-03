import { CALIFORNIA_LISTING_FACT_DEFAULTS } from '../../../../listings/state-packages/california/california-listing-facts.model';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { CaliforniaContractType, CaliforniaOfferTerms } from '../models/california-offer-terms.model';

export interface CreateCaliforniaInitialOfferTermsInput {
  contractType: CaliforniaContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createCaliforniaInitialOfferTerms(
  input: CreateCaliforniaInitialOfferTermsInput
): CaliforniaOfferTerms {
  if (input.contractType !== 'navstreet_california_residential_sale_2026') {
    throw new Error('Unsupported California agreement.');
  }
  if (input.property.state !== 'CA' || !['single_family', 'townhome', 'pud', 'condo'].includes(input.property.propertyType)) {
    throw new Error('A qualifying California residential resale listing is required.');
  }
  return {
    stateCode: 'CA', contractType: input.contractType,
    property: { ...input.property, state: 'CA' },
    legalDescription: input.property.legalDescription ?? '',
    purchase: {
      purchasePriceInCents: input.property.listPriceInCents,
      hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0,
      additionalEarnestMoneyDueDays: 10,
      earnestMoneyHolder: '', earnestMoneyDueDays: 3,
      financingType: 'unselected', loanAmountInCents: 0,
      loanApplicationDays: 5, loanApprovalDays: 21, loanTermYears: 30,
      sellerConcessionsInCents: 0,
    },
    deadlines: {
      sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 17, appraisalPeriodDays: 17,
      financingAppraisalDate: '', settlementDate: '',
    },
    conditions: {
      dueDiligence: true, appraisal: null, financing: null,
      saleOfBuyersProperty: false, additionalEarnestMoney: null,
    },
    propertyItems: {
      included: '', excluded: '', fixturesIncluded: true,
      leasedItemsDescription: '',
    },
    settlement: {
      possession: 'at_recording', possessionDelay: 0,
      specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected',
      titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15,
    },
    documentVersions: {},
    sellerFacts: { ...CALIFORNIA_LISTING_FACT_DEFAULTS },
    disclosures: { propertyConditionStatus: 'unselected', naturalHazardStatus: 'unselected', fireHardeningStatus: 'unselected', defensibleSpaceStatus: 'unselected', renovationStatus: 'unselected', waterTankStatus: 'unselected', californiaNoticesAcknowledged: null, sellerReportsHoa: null, leadPaintStatus: 'unselected', leadExemptionBasis: '', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: null, leaseStatementAcknowledged: null },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: 'America/Los_Angeles',
      electronicDeliveryAuthorized: null,
    },
  };
}