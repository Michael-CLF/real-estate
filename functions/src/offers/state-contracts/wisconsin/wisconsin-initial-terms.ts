import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { WisconsinOfferTermsDocument } from './wisconsin-offer-terms.document';
export function createWisconsinInitialOfferTerms(input: CreateInitialOfferTermsInput): WisconsinOfferTermsDocument {
  if (input.contractType !== 'navstreet_wisconsin_residential_sale_2026') throw new Error('Unsupported Wisconsin agreement.');
  if (input.property.state !== 'WI' || !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A qualifying Wisconsin residential resale listing is required.');
  }
  return {
    stateCode: 'WI', contractType: 'navstreet_wisconsin_residential_sale_2026',
    property: { ...input.property, state: 'WI' }, legalDescription: input.property.legalDescription ?? '',
    purchase: { purchasePriceInCents: input.property.listPriceInCents, earnestMoneyInCents: 0, additionalEarnestMoneyInCents: 0, earnestMoneyHolder: '', earnestMoneyDueDays: 4, financingType: 'unselected', loanAmountInCents: 0, sellerConcessionsInCents: 0 },
    deadlines: { sellerDisclosureDate: '', dueDiligenceDate: '', financingAppraisalDate: '', settlementDate: '' },
    conditions: { dueDiligence: null, appraisal: null, financing: null, saleOfBuyersProperty: null, additionalEarnestMoney: null },
    propertyItems: { included: '', excluded: '', fixturesIncluded: null, leasedItemsDescription: '' },
    settlement: { possession: 'unselected', possessionDelay: 0, specialAssessmentPayer: 'unselected', hoaTransferFeePayer: 'unselected' },
    disclosures: { propertyConditionStatus: 'unselected', leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10, hoaDocumentsStatus: 'unselected', sellerReportsExistingLeases: sellerLeases(input.listingData), leaseStatementAcknowledged: null },
    additionalTerms: '', delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: 'America/Chicago', electronicDeliveryAuthorized: null },
  };
}

function sellerLeases(data: Record<string, unknown>): boolean | null {
  const statements = data['sellerStatements'];
  if (!statements || typeof statements !== 'object' || Array.isArray(statements)) return null;
  const value = (statements as Record<string, unknown>)['leasesExist'];
  return typeof value === 'boolean' ? value : null;
}
