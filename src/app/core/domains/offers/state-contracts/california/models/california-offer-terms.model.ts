import type { CaliforniaListingFacts } from '../../../../listings/state-packages/california/california-listing-facts.model';

import type { MoneyInCents, OfferDate, OfferDateTime, OfferPropertySnapshot } from '../../../models/offer-terms.model';

export type CaliforniaContractType = 'navstreet_california_residential_sale_2026';
export type CaliforniaFinancingType = 'cash' | 'conventional' | 'fha' | 'va' | 'usda';
export type CaliforniaDisclosureStatus = 'unselected' | 'received' | 'pending' | 'not_applicable' | 'exempt';

/** One immutable version of NavStreet's California residential agreement. */
export interface CaliforniaOfferTerms {
  readonly requiredDisclosureTypes?: readonly string[];
  readonly stateCode: 'CA';
  readonly contractType: CaliforniaContractType;
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
    readonly financingType: CaliforniaFinancingType | 'unselected';
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
    readonly appraisalPeriodDays: number;
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
  readonly documentVersions: Readonly<Record<string,string>>;
  readonly sellerFacts: CaliforniaListingFacts;
  readonly disclosures: {
    readonly propertyConditionStatus: CaliforniaDisclosureStatus;
    readonly naturalHazardStatus: CaliforniaDisclosureStatus;
    readonly fireHardeningStatus: CaliforniaDisclosureStatus;
    readonly defensibleSpaceStatus: CaliforniaDisclosureStatus | 'buyer_agreement';
    readonly renovationStatus: CaliforniaDisclosureStatus;
    readonly waterTankStatus: CaliforniaDisclosureStatus;
    readonly hoaDocumentsStatus: CaliforniaDisclosureStatus;
    readonly leadPaintStatus: 'unselected' | 'received' | 'pending' | 'built_1978_or_later' | 'exempt';
    readonly leadExemptionBasis: string;
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
    readonly sellerReportsHoa: boolean | null;
    readonly sellerReportsExistingLeases: boolean | null;
    readonly leaseStatementAcknowledged: boolean | null;
    readonly californiaNoticesAcknowledged: boolean | null;
  };
  readonly additionalTerms: string;
  readonly delivery: {
    readonly expiresAt: OfferDateTime;
    readonly timeZone: 'America/Los_Angeles';
    readonly electronicDeliveryAuthorized: boolean | null;
  };
}

export const CALIFORNIA_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'navstreet_california_residential_sale_2026',
  formId: 'NAVSTREET-CA-RESIDENTIAL-2026',
  formName: 'NavStreet California Residential Purchase and Sale Agreement',
  effectiveDate: '2026-10-03',
  revisionDate: '2026-10-03',
  description: 'NavStreet-written agreement for a California residential resale between the parties.',
} as const;
