import { isAlaskaContractCompatible } from './alaska-contract-selection';
import { resolveAlaskaPropertyTimeZone } from './alaska-property-time-zone';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { AlaskaOfferTermsDocument } from './alaska-offer-terms.document';
export function createAlaskaInitialOfferTerms(input: CreateInitialOfferTermsInput): AlaskaOfferTermsDocument {
  if (!['navstreet_alaska_residential_sale_2026','navstreet_alaska_condominium_resale_2026'].includes(String(input.contractType))) throw new Error('Unsupported Alaska agreement.');
  if (input.property.state !== 'AK' || !isAlaskaContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying Alaska residential resale listing is required.');
  }
  const sellerStatements=input.listingData['sellerStatements'] as Record<string,any>|undefined;
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new Error('New-construction and developer sales require a separate agreement.');
  return {
    documentVersions: {},

    stateCode: 'AK', contractType: input.contractType as AlaskaOfferTermsDocument['contractType'],
    property: { ...input.property, state: 'AK' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { associationPacketRequired: (sellerStatements?.['ownersAssociationApplies']===true||sellerStatements?.['contractFacts']?.['isCondominium']===true||input.listingData['propertyType']==='condo'), conditionDisclosureRequired: true, propertyConditionStatus: 'pending', disclosureExemptionClaimed: (input.listingData['sellerStatements'] as Record<string,any>|undefined)?.['alaska']?.['disclosureExemptionClaimed'] === true, requiredKnownFacts: false, statutoryPacketStatus: 'pending', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_alaska_condominium_resale_2026' || sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: resolveAlaskaPropertyTimeZone(input.property.county,sellerStatements?.['alaska']?.['usesAleutianTime']), electronicDeliveryAuthorized: null },
  };
}
