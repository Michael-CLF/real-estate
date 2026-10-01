import type { ColoradoPropertyFacts, ColoradoContractElections } from './colorado-contract-elections';
import type { OfferPropertySnapshot } from '../../../models/offer-terms.model';

export type ColoradoContractType = 'navstreet_colorado_residential_2026';
export type ColoradoReceipt = 'unselected' | 'received' | 'pending' | 'not_applicable';

export interface ColoradoSellerLoan {
  available: boolean;
  ratePercent: number;
  estimatedBalanceInCents: number;
  balanceAsOf: string;
  principalInterestPaymentInCents: number;
  paymentPeriod: string;
  escrowRealEstateTaxes: boolean;
  escrowPropertyInsurance: boolean;
  escrowMortgageInsurance: boolean;
  escrowOther: string;
}

export interface ColoradoOfferTerms {
  readonly stateCode: 'CO';
  readonly contractType: ColoradoContractType;
  readonly property: OfferPropertySnapshot;
  readonly legalDescription: string;
  readonly propertyFacts: ColoradoPropertyFacts;
  readonly elections: ColoradoContractElections;
  readonly sellerLoan: ColoradoSellerLoan | null;
  readonly propertyItems: {
    included: string;
    excluded: string;
    leasedItems: string;
    waterRights: string;
    wellPermit: string;
    mineralRights: string;
  };
  readonly purchase: {
    purchasePriceInCents: number;
    earnestMoneyInCents: number;
    earnestMoneyHolder: string;
    earnestMoneyForm: string;
    financingType: 'unselected' | 'cash' | 'new_loan' | 'assumption';
    newLoanType: 'unselected' | 'conventional' | 'fha' | 'va' | 'other';
    newLoanAmountInCents: number;
    cashAtClosingInCents: number;
    availableCashConfirmed: boolean | null;
    sellerConcessionsInCents: number;
    assumption: {
      maxTransferFeeInCents: number;
      maxCashIncreaseInCents: number;
      maxRatePercent: number;
      maxPaymentInCents: number;
      maxPaymentPeriod: string;
      sellerReleaseRequired: boolean | null;
      releaseEvidenceTiming: 'unselected' | 'approval_deadline' | 'closing';
      releaseCostPayer: 'unselected' | 'buyer' | 'seller';
      maxReleaseCostInCents: number;
    };
  };
  readonly conditions: {
    saleOfBuyerProperty: boolean | null;
    saleOfBuyerPropertyAddress: string;
    appraisal: boolean | null;
    inspection: boolean | null;
    newSurvey: 'unselected' | 'none' | 'ilc' | 'survey';
    surveyPayer: 'unselected' | 'buyer' | 'seller';
    ownerTitlePolicyPayer: 'unselected' | 'buyer' | 'seller';
    deedType: 'unselected' | 'special_warranty' | 'general_warranty' | 'bargain_sale' | 'quitclaim';
    closingFeePayer: 'unselected' | 'buyer' | 'seller' | 'split';
    specialAssessmentPayer: 'unselected' | 'buyer' | 'seller';
    possessionDelayChargeInCents: number;
  };
  readonly deadlines: {
    timeOfDay: string;
    extendHoliday: boolean | null;
    alternativeEarnestMoney: string;
    recordTitle: string;
    recordTitleObjection: string;
    offRecordTitle: string;
    offRecordTitleObjection: string;
    titleResolution: string;
    thirdPartyApproval: string;
    associationDocuments: string;
    associationTermination: string;
    sellerPropertyDisclosure: string;
    leadDisclosure: string;
    newLoanApplication: string;
    newLoanTerms: string;
    newLoanAvailability: string;
    existingLoan: string;
    existingLoanTermination: string;
    loanTransferApproval: string;
    appraisal: string;
    appraisalObjection: string;
    appraisalResolution: string;
    survey: string;
    surveyObjection: string;
    surveyResolution: string;
    waterRightsExamination: string;
    mineralRightsExamination: string;
    inspectionTermination: string;
    inspectionObjection: string;
    inspectionResolution: string;
    insuranceTermination: string;
    dueDiligenceDelivery: string;
    dueDiligenceObjection: string;
    dueDiligenceResolution: string;
    conditionalSale: string;
    leadTermination: string;
    closing: string;
    possession: string;
    possessionTime: string;
  };
  readonly disclosures: {
    sellerReportsHoa: boolean | null;
    sellerPropertyStatus: ColoradoReceipt;
    leadPaintStatus: ColoradoReceipt;
    leadInspectionChoice: 'unselected' | 'ten_days' | 'waived' | 'other' | 'deadline';
    leadInspectionDays: number;
    associationStatus: ColoradoReceipt;
    waterSourceAcknowledged: boolean | null;
    radonBrochureAcknowledged: boolean | null;
    radonInformationAcknowledged: boolean | null;
  };
  readonly additionalTerms: string;
  readonly delivery: {
    expiresAt: string;
    timeZone: 'America/Denver';
    electronicDeliveryAuthorized: boolean | null;
  };
}

export const COLORADO_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'navstreet_colorado_residential_2026',
  formId: 'NAVSTREET-CO-RESIDENTIAL-2026',
  formName: 'NavStreet Colorado Residential Purchase and Sale Agreement',
  effectiveDate: '2026-01-01',
  revisionDate: '2026-09-30',
  description: 'A NavStreet agreement for Colorado resale homes, townhomes and condos.',
} as const;