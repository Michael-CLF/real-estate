import { isNorthDakotaContractCompatible } from '../north-dakota-contract-selection';
import { resolveNorthDakotaPropertyTimeZone } from '../north-dakota-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { NorthDakotaContractType, NorthDakotaOfferTerms } from '../models/north-dakota-offer-terms.model';

export interface CreateNorthDakotaInitialOfferTermsInput {
  contractType: NorthDakotaContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createNorthDakotaInitialOfferTerms(
  input: CreateNorthDakotaInitialOfferTermsInput
): NorthDakotaOfferTerms {
  if (!['navstreet_north_dakota_residential_sale_2026','navstreet_north_dakota_condominium_resale_2026'].includes(String(input.contractType))) {
    throw new Error('Unsupported North Dakota agreement.');
  }
  if (input.property.state !== 'ND' || !isNorthDakotaContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying North Dakota residential resale listing is required.');
  }
  return {
    documentVersions: {},

    stateCode: 'ND', contractType: input.contractType,
    property: { ...input.property, state: 'ND' },
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
    disclosures: { conditionDisclosureRequired: false, propertyConditionStatus: 'pending', disclosureExemptionClaimed: false, requiredKnownFacts: false, statutoryPacketStatus: 'pending', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: resolveNorthDakotaPropertyTimeZone(input.property.county,input.timeZone),
      electronicDeliveryAuthorized: null,
    },
  };
}
