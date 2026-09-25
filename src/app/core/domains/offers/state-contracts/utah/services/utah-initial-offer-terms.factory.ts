import type {
  OfferPropertySnapshot,
} from '../../../models/offer-terms.model';

import type {
  UtahContractType,
  UtahOfferTerms,
} from '../models/utah-offer-terms.model';

export interface CreateUtahInitialOfferTermsInput {
  contractType: UtahContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createUtahInitialOfferTerms(
  input: CreateUtahInitialOfferTermsInput
): UtahOfferTerms {
  if (
    input.contractType !==
    'navstreet_utah_residential_sale_2026'
  ) {
    throw new Error('Unsupported Utah agreement.');
  }

  return {
    stateCode: 'UT',
    contractType: input.contractType,
    property: {
      ...input.property,
      state: 'UT',
    },
    legalDescription:
      input.property.legalDescription ?? '',

    purchase: {
      purchasePriceInCents:
        input.property.listPriceInCents,
      earnestMoneyInCents: 0,
      additionalEarnestMoneyInCents: 0,
      earnestMoneyHolder: '',
      earnestMoneyDueDays: 4,
      financingType: 'unselected',
      loanAmountInCents: 0,
      sellerConcessionsInCents: 0,
    },

    deadlines: {
      sellerDisclosureDate: '',
      dueDiligenceDate: '',
      financingAppraisalDate: '',
      settlementDate: '',
    },

    conditions: {
      dueDiligence: null,
      appraisal: null,
      financing: null,
      saleOfBuyersProperty: null,
      additionalEarnestMoney: null,
    },

    propertyItems: {
      included: '',
      excluded: '',
      waterRightsIncluded: null,
      excludedWaterRights: '',
    },

    settlement: {
      possession: 'unselected',
      possessionDelay: 0,
      specialAssessmentPayer: 'unselected',
      hoaTransferFeePayer: 'unselected',
    },

    disclosures: {
      propertyConditionStatus: 'unselected',
      leadPaintStatus: 'unselected',
      leadInspectionSelection: 'unselected',
      leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsCurrentMethContamination: null,
      methamphetamineContaminationAcknowledged: null,
    },

    additionalTerms: '',

    delivery: {
      expiresAt: input.expiresAt,
      timeZone: 'America/Denver',
      electronicDeliveryAuthorized: null,
    },
  };
}