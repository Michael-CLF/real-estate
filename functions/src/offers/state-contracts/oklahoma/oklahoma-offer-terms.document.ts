import type { OfferPropertySnapshotDocument } from '../../offer-types';

export type OklahomaContractTypeDocument = 'residential_sale_2026';
export type OklahomaPropertyDisclosureStatusDocument = 'unselected' | 'disclosure_received' | 'disclaimer_received' | 'exempt' | 'not_required';
export type OklahomaLeadDisclosureStatusDocument = 'unselected' | 'received' | 'built_1978_or_later' | 'not_residential';
export type OklahomaTitleEvidenceSelectionDocument = 'unselected' | 'title_insurance_commitment' | 'attorney_title_opinion';
export type OklahomaSurveySelectionDocument = 'unselected' | 'mortgage_inspection_report' | 'pin_stake_boundary_survey' | 'none_unless_required';
export type OklahomaExpensePayerDocument = 'unselected' | 'buyer' | 'seller';
export type OklahomaServiceAgreementSelectionDocument = 'unselected' | 'none' | 'seller_existing_transfer' | 'buyer_selected';

export interface OklahomaOfferTermsDocument {
  readonly stateCode: 'OK';
  readonly contractType: OklahomaContractTypeDocument;
  readonly form: {
    readonly formId: 'OREC-RESIDENTIAL-SALE-2026';
    readonly formName: 'Oklahoma Uniform Contract of Sale of Real Estate - Residential Sale';
    readonly effectiveDate: '2026-01-01';
    readonly revisionDate: '2026-01-01';
  };
  readonly property: OfferPropertySnapshotDocument;
  readonly contractDocuments: readonly string[];
  readonly legalDescription: string;
  readonly purchase: {
    readonly purchasePriceInCents: number;
    readonly earnestMoneyInCents: number;
    readonly trustAccountHolder: string;
  };
  readonly closing: { readonly closingDate: string; readonly possessionTerms: string };
  readonly accessories: { readonly additionalInclusions: string; readonly exclusions: string };
  readonly timePeriods: {
    readonly referenceDate: string;
    readonly inspectionDays: number;
    readonly additionalInvestigations: string;
    readonly trrNegotiationDays: number;
    readonly titleCureDelayDays: number;
  };
  readonly disclosures: {
    readonly inHouseBrokerageServices: boolean;
    readonly propertyConditionStatus: OklahomaPropertyDisclosureStatusDocument;
    readonly leadBasedPaintStatus: OklahomaLeadDisclosureStatusDocument;
    readonly costEstimateReceived: boolean;
    readonly contractGuideAvailable: boolean;
  };
  readonly title: {
    readonly evidenceSelection: OklahomaTitleEvidenceSelectionDocument;
    readonly surveySelection: OklahomaSurveySelectionDocument;
    readonly surveyExpensePayer: OklahomaExpensePayerDocument;
  };
  readonly serviceAgreement: {
    readonly selection: OklahomaServiceAgreementSelectionDocument;
    readonly approximateCostInCents: number;
    readonly sellerContributionInCents: number;
  };
  readonly additionalProvisions: { readonly included: boolean; readonly partyProvidedText: string };
  readonly buyerAffidavitComplianceConfirmed: boolean;
  readonly delivery: {
    readonly expiresAt: string;
    readonly timeZone: string;
    readonly electronicDeliveryAuthorized: boolean | null;
  };
}
