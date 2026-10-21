import { isMinnesotaContractCompatible, MINNESOTA_CONDOMINIUM_TERMS } from '../minnesota-contract-selection';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { MinnesotaContractType, MinnesotaOfferTerms } from '../models/minnesota-offer-terms.model';

export interface CreateMinnesotaInitialOfferTermsInput {
  contractType: MinnesotaContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createMinnesotaInitialOfferTerms(
  input: CreateMinnesotaInitialOfferTermsInput
): MinnesotaOfferTerms {
  if (!['navstreet_minnesota_residential_sale_2026','navstreet_minnesota_condominium_resale_2026'].includes(input.contractType)) {
    throw new Error('Unsupported Minnesota agreement.');
  }
  if (input.property.state !== 'MN' || !isMinnesotaContractCompatible(input.contractType,input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying Minnesota residential resale listing is required.');
  }
  return {
    ...(input.contractType === 'navstreet_minnesota_condominium_resale_2026' ? {condominium:{...MINNESOTA_CONDOMINIUM_TERMS},documentVersions:{}} : {}),
    stateCode: 'MN', contractType: input.contractType,
    property: { ...input.property, state: 'MN' },
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
    disclosures: { associationCertificateDate: '', associationPacketReceivedDate: '',
      propertyConditionStatus: 'unselected', statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_minnesota_condominium_resale_2026' ? true : null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: 'America/Chicago',
      electronicDeliveryAuthorized: null,
    },
  };
}
