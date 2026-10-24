
import type { OfferPropertySnapshotDocument } from '../../offer-types';
type MoneyInCents = number;
type OfferDate = string;
type OfferDateTime = string;
type OfferPropertySnapshot = OfferPropertySnapshotDocument;

export type PennsylvaniaContractType = 'navstreet_pennsylvania_residential_sale_2026' | 'navstreet_pennsylvania_condominium_resale_2026';
export type PennsylvaniaFinancingType = 'cash' | 'conventional' | 'fha' | 'va' | 'usda';
export type PennsylvaniaDisclosureStatus = 'unselected' | 'received' | 'pending' | 'exempt';

/** One immutable version of NavStreet's Pennsylvania residential agreement. */
export interface PennsylvaniaOfferTermsDocument {
  readonly stateCode: 'PA';
  readonly contractType: PennsylvaniaContractType;
  readonly property: OfferPropertySnapshot;
  readonly documentVersions?: Readonly<Record<string,string>>;
  readonly legalDescription: string;
  readonly purchase: {
    readonly purchasePriceInCents: MoneyInCents;
    readonly hasEarnestMoney: boolean | null;
    readonly earnestMoneyInCents: MoneyInCents;
    readonly additionalEarnestMoneyInCents: MoneyInCents;
    readonly additionalEarnestMoneyDueDays: number;
    readonly earnestMoneyHolder: string;
    readonly earnestMoneyDueDays: number;
    readonly financingType: PennsylvaniaFinancingType | 'unselected';
    readonly loanAmountInCents: MoneyInCents;
    readonly loanApplicationDays: number;
    readonly loanApprovalDays: number;
    readonly loanTermYears: number;
    readonly sellerConcessionsInCents: MoneyInCents;
  };
  readonly deadlines: {
    readonly sellerDisclosureDate: OfferDate;
    readonly dueDiligenceDate: OfferDate;
    readonly inspectionPeriodDays: number;
    readonly financingAppraisalDate: OfferDate;
    readonly settlementDate: OfferDate;
  };
  readonly conditions: {
    readonly dueDiligence: boolean | null;
    readonly appraisal: boolean | null;
    readonly financing: boolean | null;
    readonly saleOfBuyersProperty: boolean | null;
    readonly additionalEarnestMoney: boolean | null;
  };
  readonly propertyItems: {
    readonly included: string;
    readonly excluded: string;
    readonly fixturesIncluded: boolean | null;
    readonly leasedItemsDescription: string;
  };
  readonly settlement: {
    readonly possession: 'unselected' | 'at_recording' | 'hours_after' | 'days_after';
    readonly possessionDelay: number;
    readonly specialAssessmentPayer: 'unselected' | 'buyer' | 'seller' | 'split';
    readonly hoaTransferFeePayer: 'unselected' | 'buyer' | 'seller' | 'split';
    readonly titlePolicyPayer: 'unselected' | 'buyer' | 'seller';
    readonly closingAgentName: string;
    readonly titleEvidenceDaysBeforeClosing: number;
  };
  readonly disclosures: {
    readonly conditionDisclosureRequired: boolean;
    readonly propertyConditionStatus: PennsylvaniaDisclosureStatus;
    readonly leadPaintStatus: 'unselected' | 'received' | 'pending' | 'built_1978_or_later' | 'exempt';
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
    readonly hoaDocumentsStatus: 'unselected' | 'received' | 'pending' | 'not_applicable';
    readonly sellerReportsHoa: boolean | null;
    readonly disclosureExemptionClaimed: boolean; requiredKnownFacts: boolean; statutoryPacketStatus: PennsylvaniaDisclosureStatus;
    readonly taxNoticeAcknowledged: boolean | null;
    readonly radonNoticeAcknowledged: boolean | null;
    readonly sellerReportsExistingLeases: boolean | null;
    readonly leaseStatementAcknowledged: boolean | null;
  };
  readonly additionalTerms: string;
  readonly delivery: {
    readonly expiresAt: OfferDateTime;
    readonly timeZone: 'America/New_York';
    readonly electronicDeliveryAuthorized: boolean | null;
  };
}

export const PENNSYLVANIA_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'navstreet_pennsylvania_residential_sale_2026',
  formId: 'NAVSTREET-PA-RESIDENTIAL-2026',
  formName: 'NavStreet Pennsylvania Residential Purchase and Sale Agreement',
  effectiveDate: '2026-10-24',
  revisionDate: '2026-10-24',
  description: 'NavStreet-written agreement for a Pennsylvania residential resale between the parties.',
} as const;
