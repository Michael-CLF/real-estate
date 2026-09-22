import type {
  MoneyInCents,
  OfferDate,
  OfferDateTime,
  OfferPropertySnapshot,
} from '../../../models/offer-terms.model';


export type FinancingType =
  | 'unselected'
  | 'cash'
  | 'loan';


export type DueDiligenceDeadlineType =
  | 'unselected'
  | 'specific_date'
  | 'days_after_effective_date';


export type PossessionTiming =
  | 'at_closing'
  | 'other';


export type SellerConcessionType =
  | 'none'
  | 'amount'
  | 'percentage';


export type DisclosureReceiptStatus =
  | 'unselected'
  | 'received'
  | 'not_received'
  | 'exempt';


export type SellerOwnershipStatus =
  | 'owned_at_least_one_year'
  | 'owned_less_than_one_year'
  | 'does_not_yet_own';


export type FuelTankOwnership =
  | 'owned'
  | 'leased';


export type AdditionalTermsPreparedBy =
  | 'buyer'
  | 'seller'
  | 'attorney';


/*
 * North Carolina agreement Sections 3 and 12.
 */
export interface NorthCarolinaPropertyTerms {
  manufacturedHomeIncluded: boolean;

  separatePropertyIncluded: boolean;
  separatePropertyDescription?: string;

  includedItemsDescription?: string;
  excludedItemsDescription?: string;
  leasedItemsDescription?: string;
}


/*
 * North Carolina agreement Sections 4 and 5.
 */
export interface NorthCarolinaPurchaseTerms {
  purchasePriceInCents: MoneyInCents;

  financingType: FinancingType;

  /*
   * Disclosure only. This does not create a contingency.
   */
  otherPropertyWillFundPurchase: boolean;
  otherPropertyDescription?: string;
}


/*
 * North Carolina agreement Sections 4, 7 and 10.
 */
export interface NorthCarolinaDepositTerms {
  depositInCents: MoneyInCents;

  /*
   * Buyer-selected delivery period after the Effective
   * Date. Offer validation limits this to 1-30 whole
   * calendar days.
   */
  depositDeliveryDays: number;

  escrowAgentName: string;

  dueDiligenceDeadlineType:
    DueDiligenceDeadlineType;

  dueDiligenceEndDate?: OfferDate;
  dueDiligenceDaysAfterEffectiveDate?: number;

  /*
   * The NC agreement fixes the deadline at 5:00 p.m.
   * North Carolina time.
   */
  dueDiligenceEndTime: '17:00';
}


/*
 * North Carolina agreement Sections 6 and 11.
 */
export interface NorthCarolinaConcessionTerms {
  concessionType: SellerConcessionType;

  sellerConcessionInCents?: MoneyInCents;
  sellerConcessionPercentage?: number;

  homeWarrantyRequested: boolean;
  homeWarrantyInCents?: MoneyInCents;
}


/*
 * North Carolina agreement Sections 8 and 9.
 */
export interface NorthCarolinaSettlementTerms {
  settlementDate: OfferDate;

  possessionTiming: PossessionTiming;

  possessionAgreementDocumentUid?: string;
}


export interface NorthCarolinaDisclosureReceipt {
  status: DisclosureReceiptStatus;

  exemptionReason?: string;

  documentUid?: string;
  documentVersionId?: string;

  acknowledged: boolean;
  acknowledgedAt?: Date;
}


export interface NorthCarolinaBuyerDisclosureTerms {
  residentialProperty:
    NorthCarolinaDisclosureReceipt;

  mineralOilGasRights:
    NorthCarolinaDisclosureReceipt;
}


export interface NorthCarolinaSellerStatements {
  ownershipStatus?: SellerOwnershipStatus;

  leadBasedPaintApplies?: boolean;
  leadBasedPaintDisclosureDocumentUid?: string;

  ownersAssociationApplies?: boolean;
  ownersAssociationName?: string;
  ownersAssociationDuesInCents?: MoneyInCents;
  ownersAssociationDuesFrequency?: string;
  ownersAssociationContact?: string;

  fuelTankPresent?: boolean;
  fuelTankOwnership?: FuelTankOwnership;

  leasesExist?: boolean;
  leaseAddendumDocumentUid?: string;
}


export interface NorthCarolinaAddendumSelection {
  addendumUid: string;

  title: string;
  documentUid: string;

  preparedBy:
    AdditionalTermsPreparedBy;

  included: boolean;
}


export interface NorthCarolinaAdditionalTermsExhibit {
  included: boolean;

  preparedBy?:
    AdditionalTermsPreparedBy;

  documentUid?: string;
}


export interface NorthCarolinaDeliveryTerms {
  expiresAt: OfferDateTime;

  timeZone: 'America/New_York';

  buyerDeliveryEmail: string;
  sellerDeliveryEmail: string;

  electronicDeliveryAuthorized: boolean;
}


/*
 * Complete North Carolina terms stored in each immutable
 * offer or counteroffer version.
 */
export interface NorthCarolinaOfferTerms {
  stateCode: 'NC';

  property: OfferPropertySnapshot;
  propertyTerms: NorthCarolinaPropertyTerms;

  purchase: NorthCarolinaPurchaseTerms;
  deposits: NorthCarolinaDepositTerms;
  concessions: NorthCarolinaConcessionTerms;
  settlement: NorthCarolinaSettlementTerms;

  buyerDisclosures:
    NorthCarolinaBuyerDisclosureTerms;

  sellerStatements:
    NorthCarolinaSellerStatements;

  addenda: NorthCarolinaAddendumSelection[];

  additionalTermsExhibit:
    NorthCarolinaAdditionalTermsExhibit;

  delivery: NorthCarolinaDeliveryTerms;
}
