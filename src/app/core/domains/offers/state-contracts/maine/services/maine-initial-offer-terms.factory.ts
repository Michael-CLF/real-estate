import { isMaineContractCompatible } from '../maine-contract-selection';
import { resolveMainePropertyTimeZone } from '../maine-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { MaineContractType, MaineOfferTerms } from '../models/maine-offer-terms.model';

export interface CreateMaineInitialOfferTermsInput {
  contractType: MaineContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createMaineInitialOfferTerms(
  input: CreateMaineInitialOfferTermsInput
): MaineOfferTerms {
  if (!['navstreet_maine_residential_sale_2026','navstreet_maine_condominium_resale_2026'].includes(String(input.contractType))) {
    throw new Error('Unsupported Maine agreement.');
  }
  if (input.property.state !== 'ME' || !isMaineContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying Maine residential resale listing is required.');
  }
  return {
    documentVersions: {},

    stateCode: 'ME', contractType: input.contractType,
    property: { ...input.property, state: 'ME' },
    legalDescription: input.property.legalDescription ?? '',
    purchase: {
      purchasePriceInCents: input.property.listPriceInCents,
      hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0,
      additionalEarnestMoneyDueDays: 10,
      earnestMoneyHolder: '', earnestMoneyDueDays: 3,
      financingType: 'unselected', loanAmountInCents: 0,
      loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30,
      sellerConcessionsInCents: 0,
    },
    deadlines: {
      sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15,
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
    disclosures: { conditionDisclosureRequired: false, sellerBrokerInvolved: false, buyerUsesBroker: null,
      propertyConditionStatus: 'pending', disclosureExemptionClaimed: false, requiredKnownFacts: false, statutoryPacketStatus: 'pending', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: resolveMainePropertyTimeZone(input.property.county),
      electronicDeliveryAuthorized: null,
    },
  };
}
