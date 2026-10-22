
import type { MoneyInCents, OfferDate, OfferDateTime, OfferPropertySnapshot } from '../../../models/offer-terms.model';

export type MarylandContractType = 'navstreet_maryland_residential_sale_2026' | 'navstreet_maryland_condominium_resale_2026';
export type MarylandFinancingType = 'cash' | 'conventional' | 'fha' | 'va' | 'usda';
export type MarylandDisclosureStatus = 'unselected' | 'received' | 'pending' | 'exempt';

/** One immutable version of NavStreet's Maryland residential agreement. */
export interface MarylandOfferTerms {
  readonly stateCode: 'MD';
  readonly contractType: MarylandContractType;
  readonly property: OfferPropertySnapshot;
  readonly documentVersions?: Readonly<Record<string,string>>;
  readonly condominium?: { readonly fewerThanSevenUnits: boolean | null };
  readonly legalDescription: string;
  readonly purchase: {
    readonly purchasePriceInCents: MoneyInCents;
    readonly hasEarnestMoney: boolean | null;
    readonly earnestMoneyInCents: MoneyInCents;
    readonly additionalEarnestMoneyInCents: MoneyInCents;
    readonly additionalEarnestMoneyDueDays: number;
    readonly earnestMoneyHolder: string;
    readonly earnestMoneyDueDays: number;
    readonly financingType: MarylandFinancingType | 'unselected';
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
    readonly propertyConditionStatus: MarylandDisclosureStatus;
    readonly leadPaintStatus: 'unselected' | 'received' | 'pending' | 'built_1978_or_later' | 'exempt';
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
    readonly hoaDocumentsStatus: 'unselected' | 'received' | 'pending' | 'not_applicable';
    readonly sellerReportsHoa: boolean | null;
    readonly disclosureExemptionClaimed: boolean; requiredKnownFacts: boolean; statutoryPacketStatus: MarylandDisclosureStatus;
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

export const MARYLAND_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'navstreet_maryland_residential_sale_2026',
  formId: 'NAVSTREET-MD-RESIDENTIAL-2026',
  formName: 'NavStreet Maryland Residential Purchase and Sale Agreement',
  effectiveDate: '2026-10-10',
  revisionDate: '2026-10-10',
  description: 'NavStreet-written agreement for a Maryland residential resale between the parties.',
} as const;

export const MARYLAND_CONDOMINIUM_CONTRACT_DEFINITION = {contractType:'navstreet_maryland_condominium_resale_2026',formId:'NAVSTREET-MD-CONDOMINIUM-2026',formName:'NavStreet Maryland Condominium Resale Purchase and Sale Agreement',effectiveDate:'2026-10-22',revisionDate:'2026-10-22',description:'Original agreement for an existing fee-simple residential condominium resale; developer and leasehold offerings excluded.'} as const;
