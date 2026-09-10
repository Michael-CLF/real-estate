/*
 * Standard ISO date format used by offer fields that do
 * not require a time of day.
 *
 * Expected value: YYYY-MM-DD
 */
export type OfferDate = string;


/*
 * ISO date-and-time value used for legal deadlines.
 *
 * The value must include a UTC offset or Z suffix.
 */
export type OfferDateTime = string;


/*
 * Currency values are stored as whole cents to avoid
 * floating-point rounding errors.
 *
 * Example: $450,000.00 = 45000000
 */
export type MoneyInCents = number;


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
 * Property information copied from the published listing
 * when the offer draft is created.
 *
 * The snapshot protects the offer history if the seller
 * later edits the published listing.
 */
export interface OfferPropertySnapshot {
  listingUid: string;

  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  zipCode: string;
  county: string;

  parcelIdentificationNumber?: string;

  deedBook?: string;
  deedPage?: string;

  /*
   * Preserved for compatibility with the existing listing
   * and offer implementation.
   */
  legalDescription?: string;

  otherPropertyReference?: string;

  propertyType: string;
  yearBuilt?: number;

  listPriceInCents: MoneyInCents;
}


/*
 * Page 1, Sections 3 and 12.
 *
 * These values describe real or personal property that is
 * included in or excluded from the proposed purchase.
 */
export interface OfferPropertyTerms {
  manufacturedHomeIncluded: boolean;

  separatePropertyIncluded: boolean;
  separatePropertyDescription?: string;

  includedItemsDescription?: string;
  excludedItemsDescription?: string;
  leasedItemsDescription?: string;
}


/*
 * Page 1, Sections 4 and 5.
 *
 * The agreement intentionally contains no financing,
 * appraisal or sale-of-other-property contingency.
 */
export interface OfferPurchaseTerms {
  purchasePriceInCents: MoneyInCents;

  financingType: FinancingType;

  /*
   * Disclosure only. This does not create a contingency.
   */
  otherPropertyWillFundPurchase: boolean;
  otherPropertyDescription?: string;
}


/*
 * Page 1, Sections 4, 7 and 10.
 *
 * The separate North Carolina due-diligence fee used in
 * the earlier prototype is intentionally omitted.
 */
export interface OfferDepositTerms {
  depositInCents: MoneyInCents;

  /*
   * The attorney-approved agreement currently requires
   * delivery within four calendar days of the Effective
   * Date. It is stored so the generated document and
   * transaction timeline use the same value.
   */
  depositDeliveryDays: 4;

  escrowAgentName: string;

  dueDiligenceDeadlineType:
  DueDiligenceDeadlineType;

  dueDiligenceEndDate?: OfferDate;
  dueDiligenceDaysAfterEffectiveDate?: number;

  /*
   * The contract fixes the deadline time at 5:00 p.m.
   * North Carolina time.
   */
  dueDiligenceEndTime: '17:00';
}


/*
 * Page 1, Sections 6 and 11.
 */
export interface OfferConcessionTerms {
  concessionType: SellerConcessionType;

  sellerConcessionInCents?: MoneyInCents;
  sellerConcessionPercentage?: number;

  homeWarrantyRequested: boolean;
  homeWarrantyInCents?: MoneyInCents;
}


/*
 * Page 1, Sections 8 and 9.
 */
export interface OfferSettlementTerms {
  settlementDate: OfferDate;

  possessionTiming: PossessionTiming;

  /*
   * Required only when possession will not occur at
   * Closing. The actual arrangement must be contained in
   * an attached possession agreement.
   */
  possessionAgreementDocumentUid?: string;
}


/*
 * One disclosure delivered to the buyer before or when
 * the buyer makes the offer.
 */
export interface OfferDisclosureReceipt {
  status: DisclosureReceiptStatus;

  exemptionReason?: string;

  documentUid?: string;
  documentVersionId?: string;

  acknowledged: boolean;
  acknowledgedAt?: Date;
}


/*
 * Buyer selections required by Section 4(c) and 4(d).
 */
export interface OfferBuyerDisclosureTerms {
  residentialProperty:
  OfferDisclosureReceipt;

  mineralOilGasRights:
  OfferDisclosureReceipt;
}


/*
 * Seller selections required by Section 6.
 *
 * These values are completed or confirmed by the seller
 * during the seller-review process. They are optional
 * while the buyer's initial offer is still being drafted.
 */
export interface OfferSellerStatements {
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


/*
 * An attorney-approved or party-prepared document attached
 * to the offer package.
 */
export interface OfferAddendumSelection {
  addendumUid: string;

  title: string;
  documentUid: string;

  preparedBy:
  AdditionalTermsPreparedBy;

  included: boolean;
}


/*
 * Page 1, Section 13.
 *
 * NavStreet does not draft language for the parties. It
 * records and attaches an exhibit prepared outside the
 * standard contract form.
 */
export interface OfferAdditionalTermsExhibit {
  included: boolean;

  preparedBy?:
  AdditionalTermsPreparedBy;

  documentUid?: string;
}


/*
 * Page 1, Section 14 and authorized electronic delivery.
 */
export interface OfferDeliveryTerms {
  expiresAt: OfferDateTime;

  timeZone: 'America/New_York';

  buyerDeliveryEmail: string;
  sellerDeliveryEmail: string;

  electronicDeliveryAuthorized: boolean;
}


/*
 * Complete set of negotiable terms and party statements
 * stored in each immutable offer or counteroffer version.
 */
export interface OfferTerms {
  stateCode: 'NC';

  property: OfferPropertySnapshot;
  propertyTerms: OfferPropertyTerms;

  purchase: OfferPurchaseTerms;
  deposits: OfferDepositTerms;
  concessions: OfferConcessionTerms;
  settlement: OfferSettlementTerms;

  buyerDisclosures:
  OfferBuyerDisclosureTerms;

  sellerStatements:
  OfferSellerStatements;

  addenda: OfferAddendumSelection[];

  additionalTermsExhibit:
  OfferAdditionalTermsExhibit;

  delivery: OfferDeliveryTerms;
}
