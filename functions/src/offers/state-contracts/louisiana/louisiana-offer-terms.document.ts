import type { OfferPropertySnapshotDocument } from '../../offer-types';

export interface LouisianaOfferTermsDocument {
  readonly stateCode: 'LA';
  readonly contractType: 'lrec_louisiana_residential_agreement_2026';
  readonly property: OfferPropertySnapshotDocument;
  readonly legalDescription: string;
  readonly propertyItems: {
    readonly groundsDescription: string;
    readonly included: string;
    readonly excluded: string;
    readonly mineralRightsReserved: boolean | null;
    readonly mineralRightsPercent: number;
  };
  readonly purchase: {
    readonly purchasePriceInCents: number;
    readonly hasEarnestMoney: boolean | null;
    readonly earnestMoneyInCents: number;
    readonly depositMethod: 'unselected' | 'check' | 'certified_funds' | 'electronic_transfer' | 'none';
    readonly earnestMoneyHolder: string;
    readonly financingType: 'unselected' | 'cash' | 'financed';
    readonly cashProofDays: number;
    readonly loanAmountInCents: number;
    readonly maxInterestRatePercent: number;
    readonly loanTermYears: number;
    readonly financingSource: 'unselected' | 'conventional' | 'fha' | 'va' | 'rural_development' | 'owner' | 'bond' | 'other';
    readonly otherFinancingConditions: string;
    readonly loanApplicationDays: number;
    readonly sellerConcessionsInCents: number;
    readonly buyerBrokerCompensationInCents: number;
  };
  readonly conditions: {
    readonly saleOfBuyersProperty: boolean | null;
    readonly saleOfBuyersPropertyTerms: string;
    readonly appraisal: boolean | null;
    readonly privateWaterSystems: number;
    readonly privateSepticSystems: number;
    readonly warranty: 'unselected' | 'with_warranties' | 'as_is' | 'new_home_warranty';
    readonly homeServiceWarranty: 'unselected' | 'will' | 'will_not';
    readonly homeServiceWarrantyCostInCents: number;
    readonly homeServiceWarrantyPayer: 'unselected' | 'buyer' | 'seller';
    readonly homeServiceWarrantyOrderedBy: string;
  };
  readonly deadlines: {
    readonly settlementDate: string;
    readonly inspectionPeriodDays: number;
    readonly appraisalCopyDays: number;
    readonly appraisalResponseDays: number;
    readonly titleCureDays: number;
  };
  readonly disclosures: {
    readonly propertyDisclosureStatus: 'unselected' | 'received' | 'pending';
    readonly leadPaintStatus: 'unselected' | 'received' | 'pending' | 'built_1978_or_later' | 'exempt';
    readonly leadInspectionSelection: 'unselected' | 'ten_days' | 'waived' | 'other_period';
    readonly leadInspectionDays: number;
  };
  readonly additionalTerms: string;
  readonly delivery: {
    readonly expiresAt: string;
    readonly timeZone: 'America/Chicago';
    readonly electronicDeliveryAuthorized: boolean | null;
  };
}