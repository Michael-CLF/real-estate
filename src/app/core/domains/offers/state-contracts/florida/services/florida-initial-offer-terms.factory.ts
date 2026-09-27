
import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { FloridaContractType, FloridaOfferTerms } from '../models/florida-offer-terms.model';

export interface CreateFloridaInitialOfferTermsInput {
  contractType: FloridaContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createFloridaInitialOfferTerms(
  input: CreateFloridaInitialOfferTermsInput
): FloridaOfferTerms {
  if (input.contractType !== 'navstreet_florida_residential_sale_2026') {
    throw new Error('Unsupported Florida agreement.');
  }
  if (input.property.state !== 'FL' || !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A qualifying Florida residential resale listing is required.');
  }
  return {
    stateCode: 'FL', contractType: input.contractType,
    property: { ...input.property, state: 'FL' },
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
      propertyConditionStatus: 'unselected', floodStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: 'America/New_York',
      electronicDeliveryAuthorized: null,
    },
  };
}
