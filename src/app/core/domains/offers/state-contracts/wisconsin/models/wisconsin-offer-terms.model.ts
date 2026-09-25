import type { MoneyInCents, OfferDate, OfferDateTime, OfferPropertySnapshot } from '../../../models/offer-terms.model';

export type WisconsinContractType = 'navstreet_wisconsin_residential_sale_2026';
export type WisconsinFinancingType = 'cash' | 'conventional' | 'fha' | 'va' | 'usda';
export type WisconsinDisclosureStatus = 'unselected' | 'received' | 'pending';

/** One immutable version of NavStreet's Wisconsin residential agreement. */
export interface WisconsinOfferTerms {
  readonly stateCode: 'WI';
  readonly contractType: WisconsinContractType;
  readonly property: OfferPropertySnapshot;
  readonly legalDescription: string;
  readonly purchase: {
    readonly purchasePriceInCents: MoneyInCents;
    readonly earnestMoneyInCents: MoneyInCents;
    readonly additionalEarnestMoneyInCents: MoneyInCents;
    readonly earnestMoneyHolder: string;
    readonly earnestMoneyDueDays: number;
    readonly financingType: WisconsinFinancingType | 'unselected';
    readonly loanAmountInCents: MoneyInCents;
    readonly sellerConcessionsInCents: MoneyInCents;
  };
  readonly deadlines: {
    readonly sellerDisclosureDate: OfferDate;
    readonly dueDiligenceDate: OfferDate;
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
  };
  readonly disclosures: {
    readonly propertyConditionStatus: WisconsinDisclosureStatus;
    readonly leadPaintStatus: 'unselected' | 'received' | 'built_1978_or_later' | 'exempt';
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
    readonly hoaDocumentsStatus: 'unselected' | 'received' | 'pending' | 'not_applicable';
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

export const WISCONSIN_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'navstreet_wisconsin_residential_sale_2026',
  formId: 'NAVSTREET-WI-RESIDENTIAL-2026',
  formName: 'NavStreet Wisconsin Residential Purchase and Sale Agreement',
  effectiveDate: '2026-09-25',
  revisionDate: '2026-09-25',
  description: 'NavStreet-written agreement for a Wisconsin residential resale between the parties.',
} as const;
