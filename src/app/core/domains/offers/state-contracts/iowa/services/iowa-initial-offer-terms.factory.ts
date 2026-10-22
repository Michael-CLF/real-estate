import { IOWA_DISCLOSURE_REVISION, IOWA_RADON_VERSION } from '../iowa-disclosure-policy';
import { resolveIowaPropertyTimeZone } from '../iowa-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { IowaContractType, IowaOfferTerms } from '../models/iowa-offer-terms.model';

export interface CreateIowaInitialOfferTermsInput {
  contractType: IowaContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createIowaInitialOfferTerms(
  input: CreateIowaInitialOfferTermsInput
): IowaOfferTerms {
  if (input.contractType !== 'navstreet_iowa_residential_sale_2026') {
    throw new Error('Unsupported Iowa agreement.');
  }
  if (input.property.state !== 'IA' || !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A qualifying Iowa residential resale listing is required.');
  }
  return {
    stateCode: 'IA', contractType: input.contractType,
    property: { ...input.property, state: 'IA' },
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
      titleEvidenceSelection: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15,
    },
    disclosures: {
      propertyConditionStatus: 'unselected', disclosureExemptionClaimed: false, requiredKnownFacts: false, statutoryPacketStatus: 'pending', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    disclosurePolicyRevision:IOWA_DISCLOSURE_REVISION, radonFactSheetVersion:IOWA_RADON_VERSION, documentVersions:{},
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: resolveIowaPropertyTimeZone(input.property.county),
      electronicDeliveryAuthorized: null,
    },
  };
}
