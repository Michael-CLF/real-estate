/*
 * Standard ISO date format used by offer fields that do
 * not require a time of day.
 *
 * Expected value:
 * YYYY-MM-DD
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
 * Example:
 * $450,000.00 = 45000000
 */
export type MoneyInCents = number;


export type FinancingType =
  | 'cash'
  | 'financing';


export type LoanType =
  | 'conventional'
  | 'fha'
  | 'va'
  | 'usda'
  | 'seller_financing'
  | 'other'
  | 'not_applicable';


export type PropertyUse =
  | 'primary_residence'
  | 'second_home'
  | 'investment_property'
  | 'other';


export type PropertySaleStatus =
  | 'not_listed'
  | 'listed'
  | 'under_contract'
  | 'closed'
  | 'not_applicable';


export type DepositPaymentMethod =
  | 'cashiers_check'
  | 'certified_check'
  | 'personal_check'
  | 'wire_transfer'
  | 'electronic_transfer'
  | 'other'
  | 'not_applicable';


export type InvestigationSelection =
  | 'planned'
  | 'not_planned'
  | 'not_applicable';


export type PossessionTiming =
  | 'at_closing'
  | 'before_closing'
  | 'after_closing';


export type OfferExpirationTimeZone =
  | 'America/New_York'
  | 'America/Chicago'
  | 'America/Denver'
  | 'America/Los_Angeles'
  | 'America/Anchorage'
  | 'Pacific/Honolulu';


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

  legalDescription?: string;

  propertyType: string;

  listPriceInCents: MoneyInCents;
}


/*
 * Purchase price and proposed payment structure.
 */
export interface OfferPurchaseTerms {
  purchasePriceInCents: MoneyInCents;

  financingType: FinancingType;

  loanType: LoanType;

  proposedLoanAmountInCents?: MoneyInCents;
  proposedDownPaymentInCents?: MoneyInCents;
  proposedCashContributionInCents?: MoneyInCents;

  preapprovalProvided: boolean;
  proofOfFundsProvided: boolean;

  preapprovalDocumentUid?: string;
  proofOfFundsDocumentUid?: string;

  loanRequiredToCompletePurchase: boolean;
  lenderAppraisalAnticipated: boolean;

  otherLoanTypeDescription?: string;
}


/*
 * Information about another property the buyer must sell
 * or close before completing this purchase.
 */
export interface OfferExistingPropertySale {
  required: boolean;

  propertyAddress?: string;

  status: PropertySaleStatus;

  listingDate?: OfferDate;
  anticipatedContractDate?: OfferDate;
  anticipatedClosingDate?: OfferDate;

  approvedAddendumRequired: boolean;
}


/*
 * Due-diligence and earnest-money terms.
 */
export interface OfferDepositTerms {
  dueDiligenceFeeInCents: MoneyInCents;

  dueDiligenceFeePaymentMethod:
    DepositPaymentMethod;

  dueDiligenceFeeDeliveryDeadline:
    OfferDateTime;

  dueDiligenceExpiration:
    OfferDateTime;

  initialEarnestMoneyInCents:
    MoneyInCents;

  initialEarnestMoneyPaymentMethod:
    DepositPaymentMethod;

  initialEarnestMoneyDeliveryDeadline:
    OfferDateTime;

  additionalEarnestMoneyInCents:
    MoneyInCents;

  additionalEarnestMoneyPaymentMethod:
    DepositPaymentMethod;

  additionalEarnestMoneyDeliveryDeadline?:
    OfferDateTime;

  escrowAgentName: string;
  escrowAgentEmail?: string;
  escrowAgentPhone?: string;
  escrowAgentAddress?: string;
}


/*
 * Buyer investigations planned during the applicable
 * due-diligence period.
 *
 * These selections create transaction tasks. They do not,
 * by themselves, create additional contract contingencies.
 */
export interface OfferInvestigationTerms {
  generalHomeInspection:
    InvestigationSelection;

  woodDestroyingInsectInspection:
    InvestigationSelection;

  radonTesting:
    InvestigationSelection;

  wellWaterTesting:
    InvestigationSelection;

  septicInspection:
    InvestigationSelection;

  survey:
    InvestigationSelection;

  appraisal:
    InvestigationSelection;

  insuranceReview:
    InvestigationSelection;

  floodZoneReview:
    InvestigationSelection;

  environmentalReview:
    InvestigationSelection;

  hoaDocumentReview:
    InvestigationSelection;

  titleAndCovenantReview:
    InvestigationSelection;

  otherInvestigationRequested: boolean;
  otherInvestigationDescription?: string;
}


/*
 * Seller-paid expenses and other authorized concessions.
 */
export interface OfferConcessionTerms {
  sellerPaidBuyerExpensesRequested: boolean;

  sellerPaidBuyerExpensesInCents:
    MoneyInCents;

  homeWarrantyRequested: boolean;
  homeWarrantyInCents: MoneyInCents;

  buyerAgentCompensationRequested:
    boolean;

  buyerAgentCompensationInCents:
    MoneyInCents;

  otherConcessionRequested: boolean;
  otherConcessionDescription?: string;
  otherConcessionInCents: MoneyInCents;
}


/*
 * A fixture, personal-property item or leased item included
 * in the offer.
 */
export interface OfferPropertyItem {
  Uid: string;

  name: string;

  category:
    | 'fixture'
    | 'personal_property'
    | 'leased_equipment'
    | 'other';

  treatment:
    | 'included'
    | 'excluded'
    | 'buyer_assumes_lease'
    | 'seller_to_remove';

  description?: string;
}


/*
 * Fixtures, personal property and leased equipment.
 */
export interface OfferPropertyInclusionTerms {
  items: OfferPropertyItem[];

  additionalPersonalPropertyRequested:
    boolean;

  additionalPersonalPropertyDescription?:
    string;

  leasedEquipmentPresent: boolean;

  leasedEquipmentObligationsAccepted:
    boolean;
}


/*
 * Proposed settlement, closing and possession.
 */
export interface OfferSettlementTerms {
  settlementDate: OfferDate;
  closingDate: OfferDate;

  proposedClosingAttorneyName?: string;
  proposedClosingAttorneyEmail?: string;
  proposedClosingAttorneyPhone?: string;

  proposedSettlementLocation?: string;

  possessionTiming: PossessionTiming;

  possessionDate?: OfferDate;
  possessionTime?: string;

  possessionAddendumRequired: boolean;

  proposedDeedName: string;
}


/*
 * Disclosure and addendum selection.
 *
 * Specific state packages determine which items are
 * required for a particular property and transaction.
 */
export interface OfferDisclosureSelection {
  disclosureUid: string;

  stateCode: string;

  title: string;

  version: string;

  required: boolean;
  received: boolean;
  acknowledged: boolean;

  acknowledgedAt?: Date;

  documentUid?: string;
}


export interface OfferAddendumSelection {
  addendumUid: string;

  stateCode: string;

  title: string;

  version: string;

  required: boolean;
  selected: boolean;

  documentUid?: string;
}


/*
 * Plain-language request submitted by a buyer or seller
 * when an approved form provision may not address the
 * requested outcome.
 *
 * Requested language does not become contract language
 * unless an authorized provision or attorney-prepared
 * provision is attached.
 */
export interface OfferAdditionalTermRequest {
  Uid: string;

  requestedBy:
    | 'buyer'
    | 'seller';

  plainLanguageRequest: string;

  resolution:
    | 'pending_review'
    | 'covered_by_standard_term'
    | 'covered_by_approved_addendum'
    | 'attorney_language_required'
    | 'attorney_language_received'
    | 'removed';

  standardTermUid?: string;
  addendumUid?: string;

  attorneyUid?: string;
  attorneyPreparedText?: string;
  attorneyDocumentUid?: string;

  approvedByBuyer: boolean;
  approvedBySeller: boolean;

  createdAt: Date;
  updatedAt: Date;
}


/*
 * Offer expiration and authorized electronic delivery.
 */
export interface OfferDeliveryTerms {
  expiresAt: OfferDateTime;

  timeZone: OfferExpirationTimeZone;

  buyerDeliveryEmail: string;
  sellerDeliveryEmail: string;

  electronicDeliveryAuthorized: boolean;
}


/*
 * Complete set of negotiable offer terms stored in each
 * immutable offer or counteroffer version.
 */
export interface OfferTerms {
  stateCode: string;

  property: OfferPropertySnapshot;

  purchase: OfferPurchaseTerms;

  existingPropertySale:
    OfferExistingPropertySale;

  deposits: OfferDepositTerms;

  investigations:
    OfferInvestigationTerms;

  concessions: OfferConcessionTerms;

  propertyInclusions:
    OfferPropertyInclusionTerms;

  settlement: OfferSettlementTerms;

  disclosures:
    OfferDisclosureSelection[];

  addenda:
    OfferAddendumSelection[];

  additionalTermRequests:
    OfferAdditionalTermRequest[];

  delivery: OfferDeliveryTerms;
}