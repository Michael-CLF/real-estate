
import type { OfferPropertySnapshotDocument } from '../../offer-types';
type MoneyInCents = number;
type OfferDate = string;
type OfferDateTime = string;
type OfferPropertySnapshot = OfferPropertySnapshotDocument;

export type SouthDakotaContractType = 'navstreet_south_dakota_residential_sale_2026';
export type SouthDakotaFinancingType = 'cash' | 'conventional' | 'fha' | 'va' | 'usda';
export type SouthDakotaDisclosureStatus = 'unselected' | 'received' | 'pending' | 'exempt';

/** One immutable version of NavStreet's SouthDakota residential agreement. */
export interface SouthDakotaOfferTermsDocument {
  readonly stateCode: 'SD';
  readonly contractType: SouthDakotaContractType;
  readonly property: OfferPropertySnapshot;
  readonly legalDescription: string;
  readonly purchase: {
    readonly purchasePriceInCents: MoneyInCents;
    readonly hasEarnestMoney: boolean | null;
    readonly earnestMoneyInCents: MoneyInCents;
    readonly additionalEarnestMoneyInCents: MoneyInCents;
    readonly additionalEarnestMoneyDueDays: number;
    readonly earnestMoneyHolder: string;
    readonly earnestMoneyDueDays: number;
    readonly financingType: SouthDakotaFinancingType | 'unselected';
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
    readonly propertyConditionStatus: SouthDakotaDisclosureStatus;
    readonly leadPaintStatus: 'unselected' | 'received' | 'pending' | 'built_1978_or_later' | 'exempt';
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
    readonly hoaDocumentsStatus: 'unselected' | 'received' | 'pending' | 'not_applicable';
    readonly sellerReportsHoa: boolean | null;
    readonly disclosureExemptionClaimed: boolean; requiredKnownFacts: boolean; statutoryPacketStatus: SouthDakotaDisclosureStatus;
    readonly taxNoticeAcknowledged: boolean | null;
    readonly radonNoticeAcknowledged: boolean | null;
    readonly sellerReportsExistingLeases: boolean | null;
    readonly leaseStatementAcknowledged: boolean | null;
  };
  readonly additionalTerms: string;
  readonly delivery: {
    readonly expiresAt: OfferDateTime;
    readonly timeZone: 'America/Chicago' | 'America/Denver';
    readonly electronicDeliveryAuthorized: boolean | null;
  };
}

export const SOUTH_DAKOTA_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'navstreet_south_dakota_residential_sale_2026',
  formId: 'NAVSTREET-SD-RESIDENTIAL-2026',
  formName: 'NavStreet South Dakota Residential Purchase and Sale Agreement',
  effectiveDate: '2026-10-10',
  revisionDate: '2026-10-10',
  description: 'NavStreet-written agreement for a South Dakota residential resale between the parties.',
} as const;
