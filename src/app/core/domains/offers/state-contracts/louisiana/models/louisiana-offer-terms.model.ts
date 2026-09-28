import type { MoneyInCents, OfferDate, OfferDateTime, OfferPropertySnapshot } from '../../../models/offer-terms.model';

export type LouisianaContractType = 'lrec_louisiana_residential_agreement_2026';
export type LouisianaLeadStatus = 'unselected' | 'received' | 'pending' | 'built_1978_or_later' | 'exempt';

/** Fields on the Louisiana 2026 agreement; the signed disclosure is separate. */
export interface LouisianaOfferTerms {
  readonly stateCode: 'LA';
  readonly contractType: LouisianaContractType;
  readonly property: OfferPropertySnapshot;
  readonly legalDescription: string;
  readonly propertyItems: {
    readonly groundsDescription: string;
    readonly included: string;
    readonly excluded: string;
    readonly mineralRightsReserved: boolean | null;
    readonly mineralRightsPercent: number;
  };
  readonly purchase: {
    readonly purchasePriceInCents: MoneyInCents;
    readonly hasEarnestMoney: boolean | null;
    readonly earnestMoneyInCents: MoneyInCents;
    readonly depositMethod: 'unselected' | 'check' | 'certified_funds' | 'electronic_transfer' | 'none';
    readonly earnestMoneyHolder: string;
    readonly financingType: 'unselected' | 'cash' | 'financed';
    readonly cashProofDays: number;
    readonly loanAmountInCents: MoneyInCents;
    readonly maxInterestRatePercent: number;
    readonly loanTermYears: number;
    readonly financingSource: 'unselected' | 'conventional' | 'fha' | 'va' | 'rural_development' | 'owner' | 'bond' | 'other';
    readonly otherFinancingConditions: string;
    readonly loanApplicationDays: number;
    readonly sellerConcessionsInCents: MoneyInCents;
    readonly buyerBrokerCompensationInCents: MoneyInCents;
  };
  readonly conditions: {
    readonly saleOfBuyersProperty: boolean | null;
    readonly saleOfBuyersPropertyTerms: string;
    readonly appraisal: boolean | null;
    readonly privateWaterSystems: number;
    readonly privateSepticSystems: number;
    readonly warranty: 'unselected' | 'with_warranties' | 'as_is' | 'new_home_warranty';
    readonly homeServiceWarranty: 'unselected' | 'will' | 'will_not';
    readonly homeServiceWarrantyCostInCents: MoneyInCents;
    readonly homeServiceWarrantyPayer: 'unselected' | 'buyer' | 'seller';
    readonly homeServiceWarrantyOrderedBy: string;
  };
  readonly deadlines: {
    readonly settlementDate: OfferDate;
    readonly inspectionPeriodDays: number;
    readonly appraisalCopyDays: number;
    readonly appraisalResponseDays: number;
    readonly titleCureDays: number;
  };
  readonly disclosures: {
    readonly propertyDisclosureStatus: 'unselected' | 'received' | 'pending';
    readonly leadPaintStatus: LouisianaLeadStatus;
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
  };
  readonly additionalTerms: string;
  readonly delivery: {
    readonly expiresAt: OfferDateTime;
    readonly timeZone: 'America/Chicago';
    readonly electronicDeliveryAuthorized: boolean | null;
  };
}

export const LOUISIANA_RESIDENTIAL_CONTRACT_DEFINITION = {
  contractType: 'lrec_louisiana_residential_agreement_2026',
  formId: 'LREC-LA-RESIDENTIAL-01-2026',
  formName: 'Louisiana Residential Agreement to Buy or Sell (LREC 01/2026)',
  effectiveDate: '2026-01-01',
  revisionDate: '2026-01-01',
  description: 'The prescribed Louisiana residential agreement, with a separately delivered seller disclosure.',
} as const;