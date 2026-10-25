import { isTennesseeContractCompatible } from './tennessee-contract-selection';
import { resolveTennesseePropertyTimeZone } from './tennessee-property-time-zone';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { TennesseeOfferTermsDocument } from './tennessee-offer-terms.document';
export function createTennesseeInitialOfferTerms(input: CreateInitialOfferTermsInput): TennesseeOfferTermsDocument {
  if (!['navstreet_tennessee_residential_sale_2026','navstreet_tennessee_condominium_resale_2026'].includes(String(input.contractType))) throw new Error('Unsupported Tennessee agreement.');
  if (input.property.state !== 'TN' || !isTennesseeContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying Tennessee residential resale listing is required.');
  }
  const sellerStatements=input.listingData['sellerStatements'] as Record<string,any>|undefined;
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new Error('New-construction and developer sales require a separate agreement.');
  return {
    documentVersions: {},

    stateCode: 'TN', contractType: input.contractType as TennesseeOfferTermsDocument['contractType'],
    property: { ...input.property, state: 'TN' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { associationPacketRequired: false, conditionDisclosureRequired: true, propertyConditionStatus: 'pending', disclosureExemptionClaimed: (input.listingData['sellerStatements'] as Record<string,any>|undefined)?.['tennessee']?.['disclosureExemptionClaimed'] === true, requiredKnownFacts: (sellerStatements?.['tennessee']?.['propertyNoticesApply']===true||input.listingData['propertyType']==='pud'), statutoryPacketStatus: 'pending', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_tennessee_condominium_resale_2026' || sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: resolveTennesseePropertyTimeZone(input.property.county,sellerStatements?.['tennessee']?.['usesCentralTime']), electronicDeliveryAuthorized: null },
  };
}
