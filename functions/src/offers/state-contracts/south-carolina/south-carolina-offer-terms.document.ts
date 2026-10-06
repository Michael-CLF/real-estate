import type { OfferPropertySnapshotDocument } from '../../offer-types';
type MoneyInCents = number; type OfferDate = string; type OfferDateTime = string; type OfferPropertySnapshot = OfferPropertySnapshotDocument;
export type SouthCarolinaContractType = 'navstreet_south_carolina_residential_sale_2026';
export type SouthCarolinaFinancingType = 'cash' | 'conventional' | 'fha' | 'va' | 'usda';
export type SouthCarolinaDisclosureStatus = 'unselected' | 'received' | 'pending' | 'not_applicable' | 'exempt' | 'waived';

/** One immutable version of NavStreet's South Carolina residential agreement. */
export interface SouthCarolinaOfferTermsDocument {
  readonly requiredDisclosureTypes?: readonly string[];
  readonly stateCode: 'SC';
  readonly contractType: SouthCarolinaContractType;
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
    readonly financingType: SouthCarolinaFinancingType | 'unselected';
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
  readonly disclosures: {
    readonly propertyConditionStatus: SouthCarolinaDisclosureStatus;
    readonly propertyExemptionBasis: string;
    readonly coastalApplies: boolean | null;
    readonly coastalBaselineDescription: string;
    readonly coastalSetbackDescription: string;
    readonly coastalStructureCoordinates: string;
    readonly coastalErosionRate: string;
    readonly vacationRentalsApply: boolean | null;
    readonly vacationRentalPeriods: string;
    readonly hoaDocumentsStatus: SouthCarolinaDisclosureStatus;
    readonly leadPaintStatus: 'unselected' | 'received' | 'pending' | 'built_1978_or_later' | 'exempt';
    readonly leadExemptionBasis: string;
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
    readonly sellerReportsHoa: boolean | null;
    readonly sellerReportsExistingLeases: boolean | null;
    readonly leaseStatementAcknowledged: boolean | null;
    readonly southCarolinaNoticesAcknowledged: boolean | null;
  };
  readonly additionalTerms: string;
  readonly delivery: {
    readonly expiresAt: OfferDateTime;
    readonly timeZone: 'America/New_York';
    readonly electronicDeliveryAuthorized: boolean | null;
  };
}
