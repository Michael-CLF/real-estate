import { isMarylandContractCompatible } from '../maryland-contract-selection';
import { resolveMarylandPropertyTimeZone } from '../maryland-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { MarylandContractType, MarylandOfferTerms } from '../models/maryland-offer-terms.model';

export interface CreateMarylandInitialOfferTermsInput {
  contractType: MarylandContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createMarylandInitialOfferTerms(
  input: CreateMarylandInitialOfferTermsInput
): MarylandOfferTerms {
  if (!['navstreet_maryland_residential_sale_2026','navstreet_maryland_condominium_resale_2026'].includes(String(input.contractType))) {
    throw new Error('Unsupported Maryland agreement.');
  }
  if (input.property.state !== 'MD' || !isMarylandContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying Maryland residential resale listing is required.');
  }
  return {
    documentVersions: {},
    ...(input.contractType === 'navstreet_maryland_condominium_resale_2026' ? {condominium:{fewerThanSevenUnits:null}} : {}),

    stateCode: 'MD', contractType: input.contractType,
    property: { ...input.property, state: 'MD' },
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
    disclosures: {
      propertyConditionStatus: 'unselected', disclosureExemptionClaimed: false, requiredKnownFacts: false, statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: resolveMarylandPropertyTimeZone(input.property.county),
      electronicDeliveryAuthorized: null,
    },
  };
}
