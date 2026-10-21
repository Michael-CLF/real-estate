import { isMinnesotaContractCompatible, MINNESOTA_CONDOMINIUM_TERMS } from './minnesota-contract-selection';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { MinnesotaOfferTermsDocument } from './minnesota-offer-terms.document';
export function createMinnesotaInitialOfferTerms(input: CreateInitialOfferTermsInput): MinnesotaOfferTermsDocument {
  if (!['navstreet_minnesota_residential_sale_2026','navstreet_minnesota_condominium_resale_2026'].includes(String(input.contractType))) throw new Error('Unsupported Minnesota agreement.');
  if (input.property.state !== 'MN' || !isMinnesotaContractCompatible(String(input.contractType),input.property.propertyType,input.property.contractFacts)) {
    throw new Error('A qualifying Minnesota residential resale listing is required.');
  }
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new Error('New-construction and developer sales require a separate agreement.');
  return {
    ...(input.contractType === 'navstreet_minnesota_condominium_resale_2026' ? {condominium:{...MINNESOTA_CONDOMINIUM_TERMS},documentVersions:{}} : {}),
    stateCode: 'MN', contractType: input.contractType as MinnesotaOfferTermsDocument['contractType'],
    property: { ...input.property, state: 'MN' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { associationCertificateDate: '', associationPacketReceivedDate: '', propertyConditionStatus: 'unselected', statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_minnesota_condominium_resale_2026' || sellerHoa(input.listingData), leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: 'America/Chicago', electronicDeliveryAuthorized: null },
  };
}
