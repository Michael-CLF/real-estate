import { isVirginiaContractCompatible } from './virginia-contract-selection';
import { resolveVirginiaPropertyTimeZone } from './virginia-property-time-zone';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { VirginiaOfferTermsDocument } from './virginia-offer-terms.document';
export function createVirginiaInitialOfferTerms(input: CreateInitialOfferTermsInput): VirginiaOfferTermsDocument {
  if (!['navstreet_virginia_residential_sale_2026','navstreet_virginia_condominium_resale_2026'].includes(String(input.contractType))) throw new Error('Unsupported Virginia agreement.');
  if (input.property.state !== 'VA' || !isVirginiaContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying Virginia residential resale listing is required.');
  }
  const sellerStatements=input.listingData['sellerStatements'] as Record<string,any>|undefined;
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new Error('New-construction and developer sales require a separate agreement.');
  return {
    documentVersions: {},

    stateCode: 'VA', contractType: input.contractType as VirginiaOfferTermsDocument['contractType'],
    property: { ...input.property, state: 'VA' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { associationPacketRequired: (sellerStatements?.['ownersAssociationApplies']===true||sellerStatements?.['contractFacts']?.['isCondominium']===true||input.listingData['propertyType']==='condo'), conditionDisclosureRequired: true, propertyConditionStatus: 'pending', disclosureExemptionClaimed: (input.listingData['sellerStatements'] as Record<string,any>|undefined)?.['virginia']?.['disclosureExemptionClaimed'] === true, requiredKnownFacts: sellerStatements?.['virginia']?.['affirmativeNoticesApply']===true, statutoryPacketStatus: 'pending', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_virginia_condominium_resale_2026' || sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: resolveVirginiaPropertyTimeZone(input.property.county), electronicDeliveryAuthorized: null },
  };
}
