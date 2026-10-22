import { isMontanaContractCompatible } from './montana-contract-selection';
import { resolveMontanaPropertyTimeZone } from './montana-property-time-zone';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { MontanaOfferTermsDocument } from './montana-offer-terms.document';
export function createMontanaInitialOfferTerms(input: CreateInitialOfferTermsInput): MontanaOfferTermsDocument {
  if (!['navstreet_montana_residential_sale_2026','navstreet_montana_condominium_resale_2026'].includes(input.contractType ?? '')) throw new Error('Unsupported Montana agreement.');
  if (input.property.state !== 'MT' || !isMontanaContractCompatible(input.contractType ?? '', input.property.propertyType, (input.listingData['sellerStatements'] as any)?.contractFacts ?? input.property.contractFacts)) {
    throw new Error('A qualifying Montana residential resale listing is required.');
  }
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new Error('New-construction and developer sales require a separate agreement.');
  return {
    stateCode: 'MT', contractType: input.contractType as MontanaOfferTermsDocument['contractType'],
    property: { ...input.property, state: 'MT' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { propertyConditionStatus: 'unselected', disclosureExemptionClaimed: (input.listingData['sellerStatements'] as Record<string, any> | undefined)?.['montana']?.['disclosureExemptionClaimed'] === true, requiredKnownFacts: ['radonTestsKnown','drugContaminationKnown','appurtenantWaterRightsKnown'].some(key => (input.listingData['sellerStatements'] as Record<string, any> | undefined)?.['montana']?.[key] !== false), statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_montana_condominium_resale_2026' ? true : sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    ...(input.contractType === 'navstreet_montana_condominium_resale_2026' ? {documentVersions: {}, condominiumAcceptancePolicy: 'accept_during_review_v2' as const} : {}),
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: resolveMontanaPropertyTimeZone(input.property.county), electronicDeliveryAuthorized: null },
  };
}
