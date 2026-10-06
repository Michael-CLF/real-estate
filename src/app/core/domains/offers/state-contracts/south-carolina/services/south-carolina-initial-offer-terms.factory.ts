import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';
import type { SouthCarolinaContractType, SouthCarolinaOfferTerms } from '../models/south-carolina-offer-terms.model';
export interface CreateSouthCarolinaInitialOfferTermsInput { contractType: SouthCarolinaContractType; property: OfferPropertySnapshot; expiresAt: string; timeZone: string; }
export function createSouthCarolinaInitialOfferTerms(input: CreateSouthCarolinaInitialOfferTermsInput): SouthCarolinaOfferTerms {
  if (input.property.state !== 'SC' || input.contractType !== 'navstreet_south_carolina_residential_sale_2026' || !['single_family','townhome','pud','condo'].includes(input.property.propertyType)) throw new Error('A qualifying South Carolina residential listing and agreement are required.');
  return {
    stateCode: 'SC', contractType: input.contractType,
    property: { ...input.property, state: 'SC' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 21, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 14, appraisalPeriodDays: 14, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    requiredDisclosureTypes: [],
    documentVersions: {},
    disclosures: { propertyConditionStatus: 'unselected', propertyExemptionBasis: '',
      coastalApplies: null, coastalBaselineDescription: '', coastalSetbackDescription: '', coastalStructureCoordinates: '', coastalErosionRate: '',
      vacationRentalsApply: null, vacationRentalPeriods: '', southCarolinaNoticesAcknowledged: null,
      sellerReportsHoa: null, leadPaintStatus: 'unselected', leadExemptionBasis: '',
      leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: null, leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: input.expiresAt, timeZone: 'America/New_York', electronicDeliveryAuthorized: null },
  };
}
