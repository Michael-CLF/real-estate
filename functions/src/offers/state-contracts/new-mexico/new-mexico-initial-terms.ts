import { isNewMexicoContractCompatible } from './new-mexico-contract-selection';
import { resolveNewMexicoPropertyTimeZone } from './new-mexico-property-time-zone';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { NewMexicoOfferTermsDocument } from './new-mexico-offer-terms.document';
export function createNewMexicoInitialOfferTerms(input: CreateInitialOfferTermsInput): NewMexicoOfferTermsDocument {
  if (!['navstreet_new_mexico_residential_sale_2026','navstreet_new_mexico_condominium_resale_2026'].includes(String(input.contractType))) throw new Error('Unsupported New Mexico agreement.');
  if (input.property.state !== 'NM' || !isNewMexicoContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying New Mexico residential resale listing is required.');
  }
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new Error('New-construction and developer sales require a separate agreement.');
  return {
    documentVersions: {},

    stateCode: 'NM', contractType: input.contractType as NewMexicoOfferTermsDocument['contractType'],
    property: { ...input.property, state: 'NM' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { taxEstimateUnavailable: (input.listingData['sellerStatements'] as Record<string,any> | undefined)?.['newMexico']?.['taxEstimateUnavailable'] === true, taxEstimateWaived: null, propertyConditionStatus: 'unselected', disclosureExemptionClaimed: (input.listingData['sellerStatements'] as Record<string, any> | undefined)?.['newMexico']?.['disclosureExemptionClaimed'] === true, requiredKnownFacts: (input.listingData['sellerStatements'] as Record<string,any> | undefined)?.['newMexico']?.['drugLabContaminationKnown'] !== false, statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_new_mexico_condominium_resale_2026' || sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: resolveNewMexicoPropertyTimeZone(input.property.county), electronicDeliveryAuthorized: null },
  };
}
