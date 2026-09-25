import type { CreateInitialOfferTermsInput } from '../state-contract-package';
import type { OklahomaOfferTermsDocument } from './oklahoma-offer-terms.document';

export function createOklahomaInitialOfferTerms(
  input: CreateInitialOfferTermsInput
): OklahomaOfferTermsDocument {
  if (input.contractType !== 'residential_sale_2026') {
    throw new Error('Oklahoma currently supports only the 2026 OREC Residential Sale contract.');
  }
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  return {
    stateCode: 'OK',
    contractType: 'residential_sale_2026',
    form: {
      formId: 'OREC-RESIDENTIAL-SALE-2026',
      formName: 'Oklahoma Uniform Contract of Sale of Real Estate - Residential Sale',
      effectiveDate: '2026-01-01',
      revisionDate: '2026-01-01',
    },
    property: { ...input.property, state: 'OK' },
    contractDocuments: [],
    legalDescription: input.property.legalDescription ?? '',
    purchase: {
      purchasePriceInCents: input.property.listPriceInCents,
      earnestMoneyInCents: 0,
      trustAccountHolder: '',
    },
    closing: { closingDate: '', possessionTerms: '' },
    accessories: { additionalInclusions: '', exclusions: '' },
    timePeriods: {
      referenceDate: '', inspectionDays: 10, additionalInvestigations: '',
      trrNegotiationDays: 7, titleCureDelayDays: 30,
    },
    disclosures: {
      inHouseBrokerageServices: false,
      propertyConditionStatus: 'unselected',
      leadBasedPaintStatus: 'unselected',
      costEstimateReceived: false,
      contractGuideAvailable: false,
    },
    title: {
      evidenceSelection: 'unselected',
      surveySelection: 'unselected',
      surveyExpensePayer: 'unselected',
    },
    serviceAgreement: {
      selection: 'unselected', approximateCostInCents: 0, sellerContributionInCents: 0,
    },
    additionalProvisions: { included: false, partyProvidedText: '' },
    buyerAffidavitComplianceConfirmed: false,
    delivery: {
      expiresAt,
      timeZone: 'America/Chicago',
      electronicDeliveryAuthorized: null,
    },
  };
}
