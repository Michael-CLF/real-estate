import type {
  NorthCarolinaOfferTerms,
} from '../state-contracts/north-carolina/models/north-carolina-offer-terms.model';

import type {
  TexasOfferTerms,
} from '../state-contracts/texas/models/texas-offer-terms.model';


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
 * Union of the state-specific terms accepted by the
 * frontend offer domain.
 *
 * State-neutral infrastructure uses this union. Existing
 * North Carolina consumers continue using OfferTerms below
 * so adding Texas cannot broaden their field types.
 */
export type StateOfferTerms =
  | NorthCarolinaOfferTerms
  | TexasOfferTerms;


/*
 * Compatibility name used throughout the existing offer
 * services and North Carolina feature.
 */
export type OfferTerms =
  NorthCarolinaOfferTerms;


/*
 * Preserve the existing import surface while the current
 * North Carolina feature is migrated incrementally.
 */
export type {
  AdditionalTermsPreparedBy,
  DisclosureReceiptStatus,
  DueDiligenceDeadlineType,
  FinancingType,
  FuelTankOwnership,
  NorthCarolinaAdditionalTermsExhibit as OfferAdditionalTermsExhibit,
  NorthCarolinaAddendumSelection as OfferAddendumSelection,
  NorthCarolinaBuyerDisclosureTerms as OfferBuyerDisclosureTerms,
  NorthCarolinaConcessionTerms as OfferConcessionTerms,
  NorthCarolinaDeliveryTerms as OfferDeliveryTerms,
  NorthCarolinaDepositTerms as OfferDepositTerms,
  NorthCarolinaDisclosureReceipt as OfferDisclosureReceipt,
  NorthCarolinaOfferTerms,
  NorthCarolinaPropertyTerms as OfferPropertyTerms,
  NorthCarolinaPurchaseTerms as OfferPurchaseTerms,
  NorthCarolinaSellerStatements as OfferSellerStatements,
  NorthCarolinaSettlementTerms as OfferSettlementTerms,
  PossessionTiming,
  SellerConcessionType,
  SellerOwnershipStatus,
} from '../state-contracts/north-carolina/models/north-carolina-offer-terms.model';
