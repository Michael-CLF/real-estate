import { resolveOregonPropertyTimeZone } from '../oregon-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { OregonContractType, OregonOfferTerms } from '../models/oregon-offer-terms.model';

export interface CreateOregonInitialOfferTermsInput {
  contractType: OregonContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createOregonInitialOfferTerms(
  input: CreateOregonInitialOfferTermsInput
): OregonOfferTerms {
  if (input.contractType !== 'navstreet_oregon_residential_sale_2026') {
    throw new Error('Unsupported Oregon agreement.');
  }
  if (input.property.state !== 'OR' || !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A qualifying Oregon residential resale listing is required.');
  }
  return {
    stateCode: 'OR', contractType: input.contractType,
    property: { ...input.property, state: 'OR' },
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
      propertyConditionStatus: 'unselected', historicSpecialAssessmentApplies: false, statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: resolveOregonPropertyTimeZone(input.property.county, input.timeZone),
      electronicDeliveryAuthorized: null,
    },
  };
}
