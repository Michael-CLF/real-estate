import type {
  MoneyInCents,
  OfferDate,
  OfferDateTime,
  OfferPropertySnapshot,
} from '../../../models/offer-terms.model';

export type OklahomaContractType = 'residential_sale_2026';
export type OklahomaPropertyDisclosureStatus =
  | 'unselected'
  | 'disclosure_received'
  | 'disclaimer_received'
  | 'exempt'
  | 'not_required';
export type OklahomaLeadDisclosureStatus =
  | 'unselected'
  | 'received'
  | 'built_1978_or_later'
  | 'not_residential';
export type OklahomaTitleEvidenceSelection =
  | 'unselected'
  | 'title_insurance_commitment'
  | 'attorney_title_opinion';
export type OklahomaSurveySelection =
  | 'unselected'
  | 'mortgage_inspection_report'
  | 'pin_stake_boundary_survey'
  | 'none_unless_required';
export type OklahomaExpensePayer = 'unselected' | 'buyer' | 'seller';
export type OklahomaServiceAgreementSelection =
  | 'unselected'
  | 'none'
  | 'seller_existing_transfer'
  | 'buyer_selected';

export interface OklahomaFormReference {
  readonly formId: 'OREC-RESIDENTIAL-SALE-2026';
  readonly formName: 'Oklahoma Uniform Contract of Sale of Real Estate - Residential Sale';
  readonly effectiveDate: '2026-01-01';
  readonly revisionDate: '2026-01-01';
}

export interface OklahomaOfferTerms {
  readonly stateCode: 'OK';
  readonly contractType: OklahomaContractType;
  readonly form: OklahomaFormReference;
  readonly property: OfferPropertySnapshot;

  readonly contractDocuments: readonly string[];
  readonly legalDescription: string;

  readonly purchase: {
    readonly purchasePriceInCents: MoneyInCents;
    readonly earnestMoneyInCents: MoneyInCents;
    readonly trustAccountHolder: string;
  };

  readonly closing: {
    readonly closingDate: OfferDate;
    readonly possessionTerms: string;
  };

  readonly accessories: {
    readonly additionalInclusions: string;
    readonly exclusions: string;
  };

  readonly timePeriods: {
    readonly referenceDate: OfferDate;
    readonly inspectionDays: number;
    readonly additionalInvestigations: string;
    readonly trrNegotiationDays: number;
    readonly titleCureDelayDays: number;
  };

  readonly disclosures: {
    readonly inHouseBrokerageServices: boolean;
    readonly propertyConditionStatus: OklahomaPropertyDisclosureStatus;
    readonly leadBasedPaintStatus: OklahomaLeadDisclosureStatus;
    readonly costEstimateReceived: boolean;
    readonly contractGuideAvailable: boolean;
  };

  readonly title: {
    readonly evidenceSelection: OklahomaTitleEvidenceSelection;
    readonly surveySelection: OklahomaSurveySelection;
    readonly surveyExpensePayer: OklahomaExpensePayer;
  };

  readonly serviceAgreement: {
    readonly selection: OklahomaServiceAgreementSelection;
    readonly approximateCostInCents: MoneyInCents;
    readonly sellerContributionInCents: MoneyInCents;
  };

  readonly additionalProvisions: {
    readonly included: boolean;
    readonly partyProvidedText: string;
  };

  readonly buyerAffidavitComplianceConfirmed: boolean;

  readonly delivery: {
    readonly expiresAt: OfferDateTime;
    readonly timeZone: string;
    readonly electronicDeliveryAuthorized: boolean | null;
  };
}

export const OKLAHOMA_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'residential_sale_2026',
  formId: 'OREC-RESIDENTIAL-SALE-2026',
  formName: 'Oklahoma Uniform Contract of Sale of Real Estate - Residential Sale',
  effectiveDate: '2026-01-01',
  revisionDate: '2026-01-01',
  description: 'OREC Residential Sale contract effective January 1, 2026.',
} as const;
