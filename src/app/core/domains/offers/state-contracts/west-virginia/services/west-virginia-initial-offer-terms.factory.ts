import { isWestVirginiaContractCompatible } from '../west-virginia-contract-selection';
import { resolveWestVirginiaPropertyTimeZone } from '../west-virginia-property-time-zone';

import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { WestVirginiaContractType, WestVirginiaOfferTerms } from '../models/west-virginia-offer-terms.model';

export interface CreateWestVirginiaInitialOfferTermsInput {
  contractType: WestVirginiaContractType;
  property: OfferPropertySnapshot;
  expiresAt: string;
  timeZone: string;
}

export function createWestVirginiaInitialOfferTerms(
  input: CreateWestVirginiaInitialOfferTermsInput
): WestVirginiaOfferTerms {
  if (!['navstreet_west_virginia_residential_sale_2026','navstreet_west_virginia_condominium_resale_2026'].includes(String(input.contractType))) {
    throw new Error('Unsupported West Virginia agreement.');
  }
  if (input.property.state !== 'WV' || !isWestVirginiaContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying West Virginia residential resale listing is required.');
  }
  return {
    documentVersions: {},

    stateCode: 'WV', contractType: input.contractType,
    property: { ...input.property, state: 'WV' },
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
    disclosures: { associationPacketRequired: false, conditionDisclosureRequired: false, propertyConditionStatus: 'pending', disclosureExemptionClaimed: false, requiredKnownFacts: false, statutoryPacketStatus: 'pending', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: null, leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10,
      hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null,
      leaseStatementAcknowledged: null,
    },
    additionalTerms: '',
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: resolveWestVirginiaPropertyTimeZone(input.property.county),
      electronicDeliveryAuthorized: null,
    },
  };
}
