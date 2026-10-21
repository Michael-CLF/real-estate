
import type { MoneyInCents, OfferDate, OfferDateTime, OfferPropertySnapshot } from '../../../models/offer-terms.model';

import type { MissouriContractType } from '../missouri-contract-selection';
export type { MissouriContractType } from '../missouri-contract-selection';
export interface MissouriSpecialPropertyTerms {
 readonly projectName: string;
 readonly unitDesignation: string;
 readonly commonElements: string;
 readonly parkingStorage: string;
 readonly resaleCertificateStatus: 'unselected' | 'received' | 'pending';
 readonly certificateReceivedDate: string;
 readonly condominiumRightsAcknowledged: boolean | null;
 readonly intendedUse: string;
 readonly surveyRequired: boolean | null;
 readonly landReviewAcknowledged: boolean | null;
 readonly tenantDocumentsStatus: 'unselected' | 'received' | 'pending' | 'not_applicable';
 readonly tenancyTransferAcknowledged: boolean | null;
}

export type MissouriFinancingType = 'cash' | 'conventional' | 'fha' | 'va' | 'usda';
export type MissouriDisclosureStatus = 'unselected' | 'received' | 'pending' | 'exempt';

/** One immutable version of NavStreet's Missouri residential agreement. */
export interface MissouriOfferTerms {
  readonly stateCode: 'MO';
  readonly contractType: MissouriContractType;
  readonly condominiumOfferEntryRevision?: '2026-10-19';
  readonly property: OfferPropertySnapshot;
  readonly legalDescription: string;
  readonly specialProperty?: MissouriSpecialPropertyTerms;
  readonly documentVersions?: Readonly<Record<string,string>>;
  readonly purchase: {
    readonly purchasePriceInCents: MoneyInCents;
    readonly hasEarnestMoney: boolean | null;
    readonly earnestMoneyInCents: MoneyInCents;
    readonly additionalEarnestMoneyInCents: MoneyInCents;
    readonly additionalEarnestMoneyDueDays: number;
    readonly earnestMoneyHolder: string;
    readonly earnestMoneyDueDays: number;
    readonly financingType: MissouriFinancingType | 'unselected';
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
    readonly propertyConditionStatus: MissouriDisclosureStatus;
    readonly leadPaintStatus: 'unselected' | 'received' | 'pending' | 'built_1978_or_later' | 'exempt' | 'not_applicable';
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
    readonly hoaDocumentsStatus: 'unselected' | 'received' | 'pending' | 'not_applicable';
    readonly sellerReportsHoa: boolean | null;
    readonly methDisclosureRequired: boolean; statutoryPacketStatus: MissouriDisclosureStatus;
    readonly taxNoticeAcknowledged: boolean | null;
    readonly radonNoticeAcknowledged: boolean | null;
    readonly sellerReportsExistingLeases: boolean | null;
    readonly leaseStatementAcknowledged: boolean | null;
  };
  readonly additionalTerms: string;
  readonly delivery: {
    readonly expiresAt: OfferDateTime;
    readonly timeZone: 'America/Chicago';
    readonly electronicDeliveryAuthorized: boolean | null;
  };
}

export const MISSOURI_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'navstreet_missouri_residential_sale_2026',
  formId: 'NAVSTREET-MO-RESIDENTIAL-2026',
  formName: 'NavStreet Missouri Residential Purchase and Sale Agreement',
  effectiveDate: '2026-10-10',
  revisionDate: '2026-10-10',
  description: 'NavStreet-written agreement for a Missouri residential resale between the parties.',
} as const;

export const MISSOURI_CONDOMINIUM_RESALE_CONTRACT_DEFINITION = {contractType:'navstreet_missouri_condominium_resale_2026',formId:'NAVSTREET_MISSOURI_CONDOMINIUM_RESALE_2026',formName:'NavStreet Missouri Condominium Resale Purchase and Sale Agreement',effectiveDate:'2026-10-12',revisionDate:'2026-10-12'} as const;

export const MISSOURI_LAND_SALE_CONTRACT_DEFINITION = {contractType:'navstreet_missouri_land_sale_2026',formId:'NAVSTREET_MISSOURI_LAND_SALE_2026',formName:'NavStreet Missouri Vacant Land Purchase and Sale Agreement',effectiveDate:'2026-10-12',revisionDate:'2026-10-12'} as const;

export const MISSOURI_SMALL_MULTIFAMILY_RESALE_CONTRACT_DEFINITION = {contractType:'navstreet_missouri_small_multifamily_resale_2026',formId:'NAVSTREET_MISSOURI_SMALL_MULTIFAMILY_RESALE_2026',formName:'NavStreet Missouri Two to Four Unit Purchase and Sale Agreement',effectiveDate:'2026-10-12',revisionDate:'2026-10-12'} as const;
