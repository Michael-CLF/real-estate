import {isFederalLeadExcluded} from '../federal-lead-policy';
import { isVermontContractCompatible } from './vermont-contract-selection';
import { resolveVermontPropertyTimeZone } from './vermont-property-time-zone';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { VermontOfferTermsDocument } from './vermont-offer-terms.document';
export function createVermontInitialOfferTerms(input: CreateInitialOfferTermsInput): VermontOfferTermsDocument {
  if (!['navstreet_vermont_residential_sale_2026','navstreet_vermont_condominium_resale_2026'].includes(String(input.contractType))) throw new Error('Unsupported Vermont agreement.');
  if (input.property.state !== 'VT' || !isVermontContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying Vermont residential resale listing is required.');
  }
  const sellerStatements=input.listingData['sellerStatements'] as Record<string,any>|undefined;
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new Error('New-construction and developer sales require a separate agreement.');
  return {
    documentVersions: {},

    stateCode: 'VT', contractType: input.contractType as VermontOfferTermsDocument['contractType'],
    property: { ...input.property, state: 'VT' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { associationPacketRequired: (sellerStatements?.['ownersAssociationApplies']===true||sellerStatements?.['contractFacts']?.['isCondominium']===true||input.listingData['propertyType']==='condo'), conditionDisclosureRequired: false, propertyConditionStatus: 'pending', disclosureExemptionClaimed: (input.listingData['sellerStatements'] as Record<string,any>|undefined)?.['vermont']?.['disclosureExemptionClaimed'] === true, requiredKnownFacts: !isFederalLeadExcluded(input.listingData), statutoryPacketStatus: 'pending', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_vermont_condominium_resale_2026' || sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: resolveVermontPropertyTimeZone(input.property.county), electronicDeliveryAuthorized: null },
  };
}
