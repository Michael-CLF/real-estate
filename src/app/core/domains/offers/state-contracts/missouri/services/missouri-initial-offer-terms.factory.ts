import { isMissouriContractCompatible } from '../missouri-contract-selection';
import { resolveMissouriPropertyTimeZone } from '../missouri-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { MissouriContractType, MissouriOfferTerms } from '../models/missouri-offer-terms.model';

export interface CreateMissouriInitialOfferTermsInput {
  contractType: MissouriContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createMissouriInitialOfferTerms(
  input: CreateMissouriInitialOfferTermsInput
): MissouriOfferTerms {
  if (input.property.state !== 'MO' || !isMissouriContractCompatible(input.contractType, input.property.propertyType, input.property.contractFacts)) throw new Error('Select the Missouri agreement matching the listing ownership and property type.');
  return {
    stateCode: 'MO', contractType: input.contractType,
    property: { ...input.property, state: 'MO' },
    legalDescription: input.property.legalDescription ?? '',
    ...(input.contractType !== 'navstreet_missouri_residential_sale_2026' ? {specialProperty:{projectName:'',unitDesignation:'',commonElements:'',parkingStorage:'',resaleCertificateStatus:'unselected' as const,certificateReceivedDate:'',condominiumRightsAcknowledged:null,intendedUse:'',surveyRequired:null,landReviewAcknowledged:null,tenantDocumentsStatus:'unselected' as const,tenancyTransferAcknowledged:null}} : {}),
    ...(input.contractType === 'navstreet_missouri_condominium_resale_2026' ? {condominiumOfferEntryRevision:'2026-10-19' as const} : {}),
    documentVersions: {},
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
      propertyConditionStatus: 'unselected', methDisclosureRequired: false, statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_missouri_condominium_resale_2026' ? true : null, leadPaintStatus: input.property.propertyType === 'land' ? 'not_applicable' : 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: resolveMissouriPropertyTimeZone(input.property.county),
      electronicDeliveryAuthorized: null,
    },
  };
}
