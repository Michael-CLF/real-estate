import type {
  OfferDateTime,
  OfferPropertySnapshot,
} from '../../../models/offer-terms.model';
import type {
  OklahomaContractType,
  OklahomaOfferTerms,
} from '../models/oklahoma-offer-terms.model';

export interface CreateOklahomaInitialOfferTermsInput {
  contractType: OklahomaContractType;
  property: OfferPropertySnapshot;
  expiresAt: OfferDateTime;
  timeZone: string;
}

export function createOklahomaInitialOfferTerms(
  input: CreateOklahomaInitialOfferTermsInput
): OklahomaOfferTerms {
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
      referenceDate: '',
      inspectionDays: 10,
      additionalInvestigations: '',
      trrNegotiationDays: 7,
      titleCureDelayDays: 30,
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
      selection: 'unselected',
      approximateCostInCents: 0,
      sellerContributionInCents: 0,
    },
    additionalProvisions: { included: false, partyProvidedText: '' },
    buyerAffidavitComplianceConfirmed: false,
    delivery: {
      expiresAt: input.expiresAt,
      timeZone: input.timeZone,
      electronicDeliveryAuthorized: null,
    },
  };
}
