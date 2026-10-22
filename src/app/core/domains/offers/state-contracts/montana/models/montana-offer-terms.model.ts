
import type { MoneyInCents, OfferDate, OfferDateTime, OfferPropertySnapshot } from '../../../models/offer-terms.model';

export type MontanaContractType = 'navstreet_montana_residential_sale_2026' | 'navstreet_montana_condominium_resale_2026';
export type MontanaFinancingType = 'cash' | 'conventional' | 'fha' | 'va' | 'usda';
export type MontanaDisclosureStatus = 'unselected' | 'received' | 'pending' | 'exempt';

/** One immutable version of NavStreet's Montana residential agreement. */
export interface MontanaOfferTerms {
  readonly stateCode: 'MT';
  readonly contractType: MontanaContractType;
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
    readonly financingType: MontanaFinancingType | 'unselected';
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
    readonly propertyConditionStatus: MontanaDisclosureStatus;
    readonly leadPaintStatus: 'unselected' | 'received' | 'pending' | 'built_1978_or_later' | 'exempt';
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
    readonly hoaDocumentsStatus: 'unselected' | 'received' | 'pending' | 'not_applicable';
    readonly sellerReportsHoa: boolean | null;
    readonly disclosureExemptionClaimed: boolean; requiredKnownFacts: boolean; statutoryPacketStatus: MontanaDisclosureStatus;
    readonly taxNoticeAcknowledged: boolean | null;
    readonly radonNoticeAcknowledged: boolean | null;
    readonly sellerReportsExistingLeases: boolean | null;
    readonly leaseStatementAcknowledged: boolean | null;
  };
  readonly documentVersions?: Readonly<Record<string, string>>;
  /** Server-recorded buyer acknowledgement; never a client-supplied delivery timestamp. */
  readonly condominiumReceiptAt?: string;
  /** Trusted revision marker; absent on preserved legacy agreements. */
  readonly condominiumAcceptancePolicy?: 'accept_during_review_v2';
  readonly additionalTerms: string;
  readonly delivery: {
    readonly expiresAt: OfferDateTime;
    readonly timeZone: 'America/Denver';
    readonly electronicDeliveryAuthorized: boolean | null;
  };
}

export const MONTANA_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'navstreet_montana_residential_sale_2026',
  formId: 'NAVSTREET-MT-RESIDENTIAL-2026',
  formName: 'NavStreet Montana Residential Purchase and Sale Agreement',
  effectiveDate: '2026-10-10',
  revisionDate: '2026-10-10',
  description: 'NavStreet-written agreement for a Montana residential resale between the parties.',
} as const;

export const MONTANA_CONDOMINIUM_CONTRACT_DEFINITION = {
 contractType: 'navstreet_montana_condominium_resale_2026', formId: 'NAVSTREET-MT-CONDOMINIUM-2026',
 formName: 'NavStreet Montana Condominium Resale Purchase and Sale Agreement',
 effectiveDate: '2026-10-22', revisionDate: '2026-10-22.2',
 description: 'Original NavStreet agreement for an existing fee-simple Montana condominium resale, including MCA 70-23-613 protections.',
} as const;
