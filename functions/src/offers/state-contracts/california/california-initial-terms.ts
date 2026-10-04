import { CALIFORNIA_LISTING_FACT_DEFAULTS, type CaliforniaListingFacts } from '../../../listings/state-listing-packages/california-listing-facts';

import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { CaliforniaOfferTermsDocument } from './california-offer-terms.document';
export function createCaliforniaInitialOfferTerms(input: CreateInitialOfferTermsInput): CaliforniaOfferTermsDocument {
  if (input.contractType !== 'navstreet_california_residential_sale_2026') throw new Error('Unsupported California agreement.');
  if (input.property.state !== 'CA' || !['single_family', 'townhome', 'pud', 'condo'].includes(input.property.propertyType)) {
    throw new Error('A qualifying California residential resale listing is required.');
  }
  const statements = input.listingData['sellerStatements'] as Record<string, unknown> | undefined;
  const readiness = input.listingData['californiaReadiness'] as { requiredDisclosureTypes: string[]; documentVersions: Record<string,string>; applicability: Record<string, { status: string; basis: string }> } | undefined;
  const documents = readiness ?? { requiredDisclosureTypes: [], documentVersions: {}, applicability: {} };
  const legacy = statements?.['california'] as Partial<CaliforniaListingFacts> | undefined;
  const sellerFacts: CaliforniaListingFacts = {
    ...CALIFORNIA_LISTING_FACT_DEFAULTS, ...legacy,
    transferDisclosure: documents.applicability['california-transfer-disclosure']?.status === 'exempt' ? 'exempt' : 'required',
    transferExemptionBasis: documents.applicability['california-transfer-disclosure']?.basis ?? '',
    naturalHazardDisclosure: documents.applicability['california-natural-hazard-disclosure']?.status === 'exempt' ? 'exempt' : 'required',
    naturalHazardExemptionBasis: documents.applicability['california-natural-hazard-disclosure']?.basis ?? '',
  };
  return {
    stateCode: 'CA', contractType: 'navstreet_california_residential_sale_2026',
    property: { ...input.property, state: 'CA' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 21, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 17, appraisalPeriodDays: 17, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    requiredDisclosureTypes: [...documents.requiredDisclosureTypes],
    documentVersions: { ...documents.documentVersions },
    sellerFacts: { ...sellerFacts },
    disclosures: { propertyConditionStatus: 'unselected', naturalHazardStatus: 'unselected', fireHardeningStatus: 'unselected', defensibleSpaceStatus: 'unselected', renovationStatus: 'unselected', waterTankStatus: 'unselected', californiaNoticesAcknowledged: null, sellerReportsHoa: sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadExemptionBasis: documents.applicability['lead-based-paint']?.basis ?? '', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: 'America/Los_Angeles', electronicDeliveryAuthorized: null },
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
