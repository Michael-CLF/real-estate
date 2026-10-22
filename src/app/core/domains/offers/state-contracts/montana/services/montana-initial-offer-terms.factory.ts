import { resolveMontanaPropertyTimeZone } from '../montana-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { MontanaContractType, MontanaOfferTerms } from '../models/montana-offer-terms.model';

export interface CreateMontanaInitialOfferTermsInput {
  contractType: MontanaContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createMontanaInitialOfferTerms(
  input: CreateMontanaInitialOfferTermsInput
): MontanaOfferTerms {
  if (!['navstreet_montana_residential_sale_2026','navstreet_montana_condominium_resale_2026'].includes(input.contractType)) {
    throw new Error('Unsupported Montana agreement.');
  }
  if (input.property.state !== 'MT' || !['single_family', 'townhome', 'pud', 'condo'].includes(input.property.propertyType)) {
    throw new Error('A qualifying Montana residential resale listing is required.');
  }
  return {
    stateCode: 'MT', contractType: input.contractType,
    property: { ...input.property, state: 'MT' },
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
      propertyConditionStatus: 'unselected', disclosureExemptionClaimed: false, requiredKnownFacts: false, statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_montana_condominium_resale_2026' ? true : null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    ...(input.contractType === 'navstreet_montana_condominium_resale_2026' ? {documentVersions: {}, condominiumAcceptancePolicy: 'accept_during_review_v2' as const} : {}),
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: resolveMontanaPropertyTimeZone(input.property.county),
      electronicDeliveryAuthorized: null,
    },
  };
}
