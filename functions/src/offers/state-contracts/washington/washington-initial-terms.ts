import { isWashingtonContractCompatible } from './washington-contract-selection';
import { resolveWashingtonPropertyTimeZone } from './washington-property-time-zone';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { WashingtonOfferTermsDocument } from './washington-offer-terms.document';
export function createWashingtonInitialOfferTerms(input: CreateInitialOfferTermsInput): WashingtonOfferTermsDocument {
  if (!['navstreet_washington_residential_sale_2026', 'navstreet_washington_condominium_resale_2026'].includes(input.contractType ?? '')) throw new Error('Unsupported Washington agreement.');
  if (input.property.state !== 'WA' || !isWashingtonContractCompatible(input.contractType ?? '', input.property.propertyType, input.property.contractFacts)) {
    throw new Error('A qualifying Washington residential resale listing is required.');
  }
  if (!isWashingtonContractCompatible(input.contractType ?? '', input.property.propertyType, (input.listingData['sellerStatements'] as any)?.contractFacts ?? input.property.contractFacts)) throw new Error('The listing ownership requires a different Washington agreement.');
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new Error('New-construction and developer sales require a separate agreement.');
  return {
    stateCode: 'WA', contractType: input.contractType as WashingtonOfferTermsDocument['contractType'],
    property: { ...input.property, state: 'WA' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { propertyConditionStatus: 'unselected', disclosureExemptionClaimed: (input.listingData['sellerStatements'] as Record<string, any> | undefined)?.['washington']?.['disclosureExemptionClaimed'] === true, requiredKnownFacts: false, statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_washington_condominium_resale_2026' ? true : sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    ...(input.contractType === 'navstreet_washington_condominium_resale_2026' ? {documentVersions: {}} : {}),
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: resolveWashingtonPropertyTimeZone(input.property.county), electronicDeliveryAuthorized: null },
  };
}
