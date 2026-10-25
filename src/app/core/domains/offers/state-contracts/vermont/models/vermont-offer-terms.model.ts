
import type { MoneyInCents, OfferDate, OfferDateTime, OfferPropertySnapshot } from '../../../models/offer-terms.model';

export type VermontContractType = 'navstreet_vermont_residential_sale_2026' | 'navstreet_vermont_condominium_resale_2026';
export type VermontFinancingType = 'cash' | 'conventional' | 'fha' | 'va' | 'usda';
export type VermontDisclosureStatus = 'unselected' | 'received' | 'pending' | 'exempt';

/** One immutable version of NavStreet's Vermont residential agreement. */
export interface VermontOfferTerms {
  readonly stateCode: 'VT';
  readonly contractType: VermontContractType;
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
    readonly financingType: VermontFinancingType | 'unselected';
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
    readonly associationPacketRequired: boolean; conditionDisclosureRequired: boolean;
    readonly propertyConditionStatus: VermontDisclosureStatus;
    readonly leadPaintStatus: 'unselected' | 'received' | 'pending' | 'built_1978_or_later' | 'exempt';
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
    readonly hoaDocumentsStatus: 'unselected' | 'received' | 'pending' | 'not_applicable';
    readonly sellerReportsHoa: boolean | null;
    readonly disclosureExemptionClaimed: boolean; requiredKnownFacts: boolean; statutoryPacketStatus: VermontDisclosureStatus;
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

export const VERMONT_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'navstreet_vermont_residential_sale_2026',
  formId: 'NAVSTREET-GA-RESIDENTIAL-2026',
  formName: 'NavStreet Vermont Residential Purchase and Sale Agreement',
  effectiveDate: '2026-10-25',
  revisionDate: '2026-10-25',
  description: 'NavStreet-written agreement for a Vermont residential resale between the parties.',
} as const;

export const VERMONT_CONDOMINIUM_CONTRACT_DEFINITION = {contractType:'navstreet_vermont_condominium_resale_2026',formId:'NAVSTREET-GA-CONDOMINIUM-2026',formName:'NavStreet Vermont Condominium Resale Purchase and Sale Agreement',effectiveDate:'2026-10-25',revisionDate:'2026-10-25',description:'Original agreement for an existing fee-simple residential condominium resale; developer and leasehold offerings excluded.'} as const;
