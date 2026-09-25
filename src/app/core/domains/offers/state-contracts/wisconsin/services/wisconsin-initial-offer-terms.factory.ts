import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { WisconsinContractType, WisconsinOfferTerms } from '../models/wisconsin-offer-terms.model';

export interface CreateWisconsinInitialOfferTermsInput {
  contractType: WisconsinContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createWisconsinInitialOfferTerms(
  input: CreateWisconsinInitialOfferTermsInput
): WisconsinOfferTerms {
  if (input.contractType !== 'navstreet_wisconsin_residential_sale_2026') {
    throw new Error('Unsupported Wisconsin agreement.');
  }
  if (input.property.state !== 'WI' || !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A qualifying Wisconsin residential resale listing is required.');
  }
  return {
    stateCode: 'WI', contractType: input.contractType,
    property: { ...input.property, state: 'WI' },
    legalDescription: input.property.legalDescription ?? '',
    purchase: {
      purchasePriceInCents: input.property.listPriceInCents,
      earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0,
      earnestMoneyHolder: '', earnestMoneyDueDays: 4,
      financingType: 'unselected', loanAmountInCents: 0,
      sellerConcessionsInCents: 0,
    },
    deadlines: {
      sellerDisclosureDate: '', dueDiligenceDate: '',
      financingAppraisalDate: '', settlementDate: '',
    },
    conditions: {
      dueDiligence: null, appraisal: null, financing: null,
      saleOfBuyersProperty: null, additionalEarnestMoney: null,
    },
    propertyItems: {
      included: '', excluded: '', fixturesIncluded: null,
      leasedItemsDescription: '',
    },
    settlement: {
      possession: 'unselected', possessionDelay: 0,
      specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected',
    },
    disclosures: {
      propertyConditionStatus: 'unselected', leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: 'America/Chicago',
      electronicDeliveryAuthorized: null,
    },
  };
}
