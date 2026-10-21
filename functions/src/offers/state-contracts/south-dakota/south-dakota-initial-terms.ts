import { resolveSouthDakotaPropertyTimeZone } from './south-dakota-property-time-zone';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { SouthDakotaOfferTermsDocument } from './south-dakota-offer-terms.document';
export function createSouthDakotaInitialOfferTerms(input: CreateInitialOfferTermsInput): SouthDakotaOfferTermsDocument {
  if (input.contractType !== 'navstreet_south_dakota_residential_sale_2026') throw new Error('Unsupported South Dakota agreement.');
  if (input.property.state !== 'SD' || !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A qualifying South Dakota residential resale listing is required.');
  }
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new Error('New-construction and developer sales require a separate agreement.');
  return {
    stateCode: 'SD', contractType: 'navstreet_south_dakota_residential_sale_2026',
    property: { ...input.property, state: 'SD' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { propertyConditionStatus: 'unselected', disclosureExemptionClaimed: (input.listingData['sellerStatements'] as Record<string, any> | undefined)?.['southDakota']?.['disclosureExemptionClaimed'] === true, requiredKnownFacts: (input.listingData['sellerStatements'] as Record<string,any> | undefined)?.['southDakota']?.['disclosureExemptionClaimed'] === true && (input.listingData['sellerStatements'] as Record<string,any> | undefined)?.['southDakota']?.['privateTransferFeeKnown'] !== false, statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: resolveSouthDakotaPropertyTimeZone(input.property.county, (input.listingData['sellerStatements'] as Record<string, any> | undefined)?.['southDakota']?.['usesMountainTime']), electronicDeliveryAuthorized: null },
  };
}
