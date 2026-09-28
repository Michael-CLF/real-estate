import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { LouisianaOfferTermsDocument } from './louisiana-offer-terms.document';

export function createLouisianaInitialOfferTerms(input: CreateInitialOfferTermsInput): LouisianaOfferTermsDocument {
  if (input.contractType !== 'lrec_louisiana_residential_agreement_2026' ||
    input.property.state !== 'LA' ||
    !['single_family', 'townhome', 'pud'].includes(input.property.propertyType)) {
    throw new Error('A Louisiana residential resale listing and the current LREC agreement are required.');
  }
  const lotSize = input.listingData['lotSize'];
  const lotSizeUnit = input.listingData['lotSizeUnit'];

  const groundsDescription =
    typeof lotSize === 'number' &&
      Number.isFinite(lotSize) &&
      lotSize > 0 &&
      (lotSizeUnit === 'acres' || lotSizeUnit === 'square_feet')
      ? `${lotSize} ${lotSizeUnit === 'acres' ? 'acres' : 'square feet'}`
      : 'As per record title';
  return {
    stateCode: 'LA', contractType: 'lrec_louisiana_residential_agreement_2026',
    property: { ...input.property, state: 'LA' },
    legalDescription: input.property.legalDescription ?? '',
    propertyItems: {
      groundsDescription,
      included: '',
      excluded: '',
      mineralRightsReserved: null,
      mineralRightsPercent: 0,
    },
    purchase: {
      purchasePriceInCents: input.property.listPriceInCents, hasEarnestMoney: null,
      earnestMoneyInCents: 0, depositMethod: 'unselected', earnestMoneyHolder: '',
      financingType: 'unselected', cashProofDays: 5, loanAmountInCents: 0,
      maxInterestRatePercent: 0, loanTermYears: 30, financingSource: 'unselected',
      otherFinancingConditions: '', loanApplicationDays: 5,
      sellerConcessionsInCents: 0, buyerBrokerCompensationInCents: 0,
    },
    conditions: {
      saleOfBuyersProperty: null, saleOfBuyersPropertyTerms: '', appraisal: null,
      privateWaterSystems: 0, privateSepticSystems: 0, warranty: 'unselected',
      homeServiceWarranty: 'unselected', homeServiceWarrantyCostInCents: 0,
      homeServiceWarrantyPayer: 'unselected', homeServiceWarrantyOrderedBy: '',
    },
    deadlines: { settlementDate: '', inspectionPeriodDays: 10, appraisalCopyDays: 5, appraisalResponseDays: 3, titleCureDays: 30 },
    disclosures: { propertyDisclosureStatus: 'unselected', leadPaintStatus: 'unselected', leadInspectionSelection: 'unselected', leadInspectionDays: 10 },
    additionalTerms: '',
    delivery: { expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), timeZone: 'America/Chicago', electronicDeliveryAuthorized: null },
  };
}