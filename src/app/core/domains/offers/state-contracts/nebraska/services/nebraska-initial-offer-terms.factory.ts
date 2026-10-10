import { resolveNebraskaPropertyTimeZone } from '../nebraska-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { NebraskaContractType, NebraskaOfferTerms } from '../models/nebraska-offer-terms.model';

export interface CreateNebraskaInitialOfferTermsInput {
  contractType: NebraskaContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createNebraskaInitialOfferTerms(
  input: CreateNebraskaInitialOfferTermsInput
): NebraskaOfferTerms {
  if (input.contractType !== 'navstreet_nebraska_residential_sale_2026') {
    throw new Error('Unsupported Nebraska agreement.');
  }
  if (input.property.state !== 'NE' || !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A qualifying Nebraska residential resale listing is required.');
  }
  return {
    stateCode: 'NE', contractType: input.contractType,
    property: { ...input.property, state: 'NE' },
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
      propertyConditionStatus: 'unselected', statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: resolveNebraskaPropertyTimeZone(input.property.county, input.timeZone),
      electronicDeliveryAuthorized: null,
    },
  };
}
