import { resolveNewMexicoPropertyTimeZone } from '../new-mexico-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { NewMexicoContractType, NewMexicoOfferTerms } from '../models/new-mexico-offer-terms.model';

export interface CreateNewMexicoInitialOfferTermsInput {
  contractType: NewMexicoContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createNewMexicoInitialOfferTerms(
  input: CreateNewMexicoInitialOfferTermsInput
): NewMexicoOfferTerms {
  if (input.contractType !== 'navstreet_new_mexico_residential_sale_2026') {
    throw new Error('Unsupported NewMexico agreement.');
  }
  if (input.property.state !== 'NM' || !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A qualifying NewMexico residential resale listing is required.');
  }
  return {
    stateCode: 'NM', contractType: input.contractType,
    property: { ...input.property, state: 'NM' },
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
      timeZone: resolveNewMexicoPropertyTimeZone(input.property.county),
      electronicDeliveryAuthorized: null,
    },
  };
}
