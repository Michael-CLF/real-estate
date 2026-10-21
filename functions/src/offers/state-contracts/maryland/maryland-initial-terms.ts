import { HttpsError } from 'firebase-functions/v2/https';
import { resolveMarylandPropertyTimeZone } from './maryland-property-time-zone';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { MarylandOfferTermsDocument } from './maryland-offer-terms.document';
export function createMarylandInitialOfferTerms(input: CreateInitialOfferTermsInput): MarylandOfferTermsDocument {
  if (input.contractType !== 'navstreet_maryland_residential_sale_2026') throw new Error('Unsupported Maryland agreement.');
  if (input.property.state !== 'MD' || !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A qualifying Maryland residential resale listing is required.');
  }
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new Error('New-construction and developer sales require a separate agreement.');
  if ((input.listingData['sellerStatements'] as Record<string,any> | undefined)?.['maryland']?.['groundRentApplies'] === true) throw new HttpsError('failed-precondition','Maryland ground-rent/leasehold properties require a separate agreement and are outside this resale package.');
  return {
    stateCode: 'MD', contractType: 'navstreet_maryland_residential_sale_2026',
    property: { ...input.property, state: 'MD' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { propertyConditionStatus: 'unselected', disclosureExemptionClaimed: (input.listingData['sellerStatements'] as Record<string, any> | undefined)?.['maryland']?.['disclosureExemptionClaimed'] === true, requiredKnownFacts: ['deferredWaterSewerCharges','superfundNearby','otherPropertyNoticeApplies','rentalLeadObligationApplies'].some(key => (input.listingData['sellerStatements'] as Record<string,any> | undefined)?.['maryland']?.[key] !== false), statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: resolveMarylandPropertyTimeZone(input.property.county), electronicDeliveryAuthorized: null },
  };
}
