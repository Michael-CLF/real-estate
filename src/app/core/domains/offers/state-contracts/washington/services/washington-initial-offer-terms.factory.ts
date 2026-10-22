import { isWashingtonContractCompatible } from '../washington-contract-selection';
import { resolveWashingtonPropertyTimeZone } from '../washington-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { WashingtonContractType, WashingtonOfferTerms } from '../models/washington-offer-terms.model';

export interface CreateWashingtonInitialOfferTermsInput {
  contractType: WashingtonContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createWashingtonInitialOfferTerms(
  input: CreateWashingtonInitialOfferTermsInput
): WashingtonOfferTerms {
  if (!['navstreet_washington_residential_sale_2026', 'navstreet_washington_condominium_resale_2026'].includes(input.contractType ?? '')) {
    throw new Error('Unsupported Washington agreement.');
  }
  if (input.property.state !== 'WA' || !isWashingtonContractCompatible(input.contractType ?? '', input.property.propertyType, input.property.contractFacts)) {
    throw new Error('A qualifying Washington residential resale listing is required.');
  }
  return {
    stateCode: 'WA', contractType: input.contractType,
    property: { ...input.property, state: 'WA' },
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
      propertyConditionStatus: 'unselected', disclosureExemptionClaimed: false, requiredKnownFacts: false, statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_washington_condominium_resale_2026' ? true : null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    ...(input.contractType === 'navstreet_washington_condominium_resale_2026' ? {documentVersions: {}} : {}),
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: resolveWashingtonPropertyTimeZone(input.property.county),
      electronicDeliveryAuthorized: null,
    },
  };
}
