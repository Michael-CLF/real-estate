import { resolveNewHampshirePropertyTimeZone } from '../new-hampshire-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { NewHampshireContractType, NewHampshireOfferTerms } from '../models/new-hampshire-offer-terms.model';

export interface CreateNewHampshireInitialOfferTermsInput {
  contractType: NewHampshireContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createNewHampshireInitialOfferTerms(
  input: CreateNewHampshireInitialOfferTermsInput
): NewHampshireOfferTerms {
  if (input.contractType !== 'navstreet_new_hampshire_residential_sale_2026') {
    throw new Error('Unsupported New Hampshire agreement.');
  }
  if (input.property.state !== 'NH' || !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A qualifying NewHampshire residential resale listing is required.');
  }
  return {
    stateCode: 'NH', contractType: input.contractType,
    property: { ...input.property, state: 'NH' },
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
      timeZone: resolveNewHampshirePropertyTimeZone(input.property.county),
      electronicDeliveryAuthorized: null,
    },
  };
}
