import { isSouthDakotaContractCompatible } from '../south-dakota-contract-selection';
import { resolveSouthDakotaPropertyTimeZone } from '../south-dakota-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { SouthDakotaContractType, SouthDakotaOfferTerms } from '../models/south-dakota-offer-terms.model';

export interface CreateSouthDakotaInitialOfferTermsInput {
  contractType: SouthDakotaContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createSouthDakotaInitialOfferTerms(
  input: CreateSouthDakotaInitialOfferTermsInput
): SouthDakotaOfferTerms {
  if (!['navstreet_south_dakota_residential_sale_2026','navstreet_south_dakota_condominium_resale_2026'].includes(String(input.contractType))) {
    throw new Error('Unsupported SouthDakota agreement.');
  }
  if (input.property.state !== 'SD' || !isSouthDakotaContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying SouthDakota residential resale listing is required.');
  }
  return {
    documentVersions: {},

    stateCode: 'SD', contractType: input.contractType,
    property: { ...input.property, state: 'SD' },
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
      timeZone: resolveSouthDakotaPropertyTimeZone(input.property.county, input.timeZone),
      electronicDeliveryAuthorized: null,
    },
  };
}
