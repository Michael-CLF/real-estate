import { HttpsError } from 'firebase-functions/v2/https';
import { isMissouriContractCompatible, type MissouriContractType } from './missouri-contract-selection';
import { resolveMissouriPropertyTimeZone } from './missouri-property-time-zone';
import { sellerLeases, sellerHoa } from '../initial-listing-facts';


import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { MissouriOfferTermsDocument } from './missouri-offer-terms.document';
export function createMissouriInitialOfferTerms(input: CreateInitialOfferTermsInput): MissouriOfferTermsDocument {
  const facts = (input.listingData['sellerStatements'] as Record<string, any> | undefined)?.['contractFacts'];
  if (input.property.state !== 'MO' || !isMissouriContractCompatible(input.contractType ?? '', input.property.propertyType, facts)) throw new HttpsError('failed-precondition','The listing ownership changed or the selected agreement does not match this property. Refresh the listing before starting a new offer.');
  const construction = input.listingData['construction'] as Record<string, unknown> | undefined;
  if (construction?.['newConstruction'] === true) throw new HttpsError('failed-precondition','New-construction and developer sales require a separate agreement.');
  return {
    stateCode: 'MO', contractType: input.contractType as MissouriContractType,
    property: { ...input.property, ...(facts ? {contractFacts:{...facts}} : {}), state: 'MO' }, legalDescription: input.property.legalDescription ?? '',
    ...(input.contractType !== 'navstreet_missouri_residential_sale_2026' ? {specialProperty:{projectName:'',unitDesignation:'',commonElements:'',parkingStorage:'',resaleCertificateStatus:'unselected' as const,certificateReceivedDate:'',condominiumRightsAcknowledged:null,intendedUse:'',surveyRequired:null,landReviewAcknowledged:null,tenantDocumentsStatus:'unselected' as const,tenancyTransferAcknowledged:null}} : {}),
    ...(input.contractType === 'navstreet_missouri_condominium_resale_2026' ? {condominiumOfferEntryRevision:'2026-10-19' as const} : {}),
    documentVersions: {},
    purchase: { purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, additionalEarnestMoneyDueDays: 10, earnestMoneyHolder: '', earnestMoneyDueDays: 3, financingType: 'unselected', loanAmountInCents: 0, loanApplicationDays: 5, loanApprovalDays: 30, loanTermYears: 30, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', inspectionPeriodDays: 15, financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: true, appraisal: null, financing: null, saleOfBuyersProperty: false, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: true, leasedItemsDescription: '' },
    settlement: { possession: 'at_recording', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected', titlePolicyPayer: 'unselected', closingAgentName: '', titleEvidenceDaysBeforeClosing: 15 },
    disclosures: { propertyConditionStatus: 'unselected', methDisclosureRequired: ((input.listingData['sellerStatements'] as Record<string, any> | undefined)?.['missouri']?.['methProductionKnown'] !== false || (input.listingData['sellerStatements'] as Record<string, any> | undefined)?.['missouri']?.['drugConvictionKnown'] !== false), statutoryPacketStatus: 'unselected', taxNoticeAcknowledged: null, radonNoticeAcknowledged: null, sellerReportsHoa: input.contractType === 'navstreet_missouri_condominium_resale_2026' ? true : sellerHoa(input.listingData), leadPaintStatus: input.property.propertyType === 'land' ? 'not_applicable' : 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: resolveMissouriPropertyTimeZone(input.property.county), electronicDeliveryAuthorized: null },
  };
}
