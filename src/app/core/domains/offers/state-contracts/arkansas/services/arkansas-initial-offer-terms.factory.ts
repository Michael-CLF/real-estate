import { isArkansasContractCompatible } from '../arkansas-contract-selection';
import { resolveArkansasPropertyTimeZone } from '../arkansas-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { ArkansasContractType, ArkansasOfferTerms } from '../models/arkansas-offer-terms.model';

export interface CreateArkansasInitialOfferTermsInput {
  contractType: ArkansasContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createArkansasInitialOfferTerms(
  input: CreateArkansasInitialOfferTermsInput
): ArkansasOfferTerms {
  if (!['navstreet_arkansas_residential_sale_2026','navstreet_arkansas_condominium_resale_2026'].includes(String(input.contractType))) {
    throw new Error('Unsupported Arkansas agreement.');
  }
  if (input.property.state !== 'AR' || !isArkansasContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying Arkansas residential resale listing is required.');
  }
  return {
    documentVersions: {},

    stateCode: 'AR', contractType: input.contractType,
    property: { ...input.property, state: 'AR' },
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
      timeZone: resolveArkansasPropertyTimeZone(input.property.county),
      electronicDeliveryAuthorized: null,
    },
  };
}
