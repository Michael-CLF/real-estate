import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { SouthCarolinaOfferTermsDocument } from './south-carolina-offer-terms.document';
export function createSouthCarolinaInitialOfferTerms(input: CreateInitialOfferTermsInput): SouthCarolinaOfferTermsDocument {
  if (input.contractType !== 'navstreet_south_carolina_residential_sale_2026') throw new Error('Unsupported South Carolina agreement.');
  if (input.property.state !== 'SC' || !['single_family', 'townhome', 'pud', 'condo'].includes(input.property.propertyType)) {
    throw new Error('A qualifying South Carolina residential resale listing is required.');
  }
  const documents = input.listingData['southCarolinaDocuments'] as { documentVersions: Record<string,string> } | undefined;
  return {
    stateCode: 'SC', contractType: 'navstreet_south_carolina_residential_sale_2026',
    property: { ...input.property, state: 'SC' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 21, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 14, appraisalPeriodDays: 14, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    requiredDisclosureTypes: [],
    documentVersions: { ...documents?.documentVersions },
    disclosures: { propertyConditionStatus: 'unselected', propertyExemptionBasis: '',
      coastalApplies: null, coastalBaselineDescription: '', coastalSetbackDescription: '', coastalStructureCoordinates: '', coastalErosionRate: '',
      vacationRentalsApply: null, vacationRentalPeriods: '', southCarolinaNoticesAcknowledged: null,
      sellerReportsHoa: sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadExemptionBasis: '',
      leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected',
      sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: 'America/New_York', electronicDeliveryAuthorized: null },
  };
}

function sellerLeases(data: Record<string, unknown>): boolean | null {
  const statements = data['sellerStatements'];
  if (!statements || typeof statements !== 'object' || Array.isArray(statements)) return null;
  const value = (statements as Record<string, unknown>)['leasesExist'];
  return typeof value === 'boolean' ? value : null;
}

function sellerHoa(data: Record<string, unknown>): boolean | null {
  const statements = data['sellerStatements'];
  if (statements && typeof statements === 'object' && !Array.isArray(statements)) {
    const value = (statements as Record<string, unknown>)['ownersAssociationApplies'];
    if (typeof value === 'boolean') return value;
  }
  const hoa = data['hoa'];
  if (hoa && typeof hoa === 'object' && !Array.isArray(hoa)) {
    const value = (hoa as Record<string, unknown>)['hasHoa'];
    if (typeof value === 'boolean') return value;
  }
  return null;
}
