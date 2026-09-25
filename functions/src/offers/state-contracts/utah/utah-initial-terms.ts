import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { UtahOfferTermsDocument } from './utah-offer-terms.document';
export function createUtahInitialOfferTerms(input: CreateInitialOfferTermsInput): UtahOfferTermsDocument {
  if (input.contractType !== 'navstreet_utah_residential_sale_2026') throw new Error('Unsupported Utah agreement.');
  return {
    stateCode: 'UT', contractType: 'navstreet_utah_residential_sale_2026',
    property: { ...input.property, state: 'UT' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, earnestMoneyHolder: '', earnestMoneyDueDays: 4, financingType: 'unselected', loanAmountInCents: 0, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: null, appraisal: null, financing: null, saleOfBuyersProperty: null, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', waterRightsIncluded: null, excludedWaterRights: '' },
    settlement: { possession: 'unselected', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected' },
    disclosures: { propertyConditionStatus: 'unselected', leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsCurrentMethContamination: sellerMeth(input.listingData), methamphetamineContaminationAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: 'America/Denver', electronicDeliveryAuthorized: null },
  };
}

function sellerMeth(data: Record<string, unknown>): boolean | null {
  const statements = data['sellerStatements'];
  if (!statements || typeof statements !== 'object' || Array.isArray(statements)) return null;
  const value = (statements as Record<string, unknown>)['methamphetamineContaminationKnown'];
  return typeof value === 'boolean' ? value : null;
}
