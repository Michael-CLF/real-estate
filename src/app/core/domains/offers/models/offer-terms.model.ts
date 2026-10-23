import type { MaineOfferTerms } from '../state-contracts/maine/models/maine-offer-terms.model';
import type { MississippiOfferTerms } from '../state-contracts/mississippi/models/mississippi-offer-terms.model';
import type { ArkansasOfferTerms } from '../state-contracts/arkansas/models/arkansas-offer-terms.model';
import type { IllinoisOfferTerms } from '../state-contracts/illinois/models/illinois-offer-terms.model';
import type { WyomingOfferTerms } from '../state-contracts/wyoming/models/wyoming-offer-terms.model';
import type { SouthDakotaOfferTerms } from '../state-contracts/south-dakota/models/south-dakota-offer-terms.model';
import type { NewMexicoOfferTerms } from '../state-contracts/new-mexico/models/new-mexico-offer-terms.model';
import type { MarylandOfferTerms } from '../state-contracts/maryland/models/maryland-offer-terms.model';
import type { MontanaOfferTerms } from '../state-contracts/montana/models/montana-offer-terms.model';
import type { IowaOfferTerms } from '../state-contracts/iowa/models/iowa-offer-terms.model';
import type { WashingtonOfferTerms } from '../state-contracts/washington/models/washington-offer-terms.model';
import type { DelawareOfferTerms } from '../state-contracts/delaware/models/delaware-offer-terms.model';
import type { OhioOfferTerms } from '../state-contracts/ohio/models/ohio-offer-terms.model';
import type { KansasOfferTerms } from '../state-contracts/kansas/models/kansas-offer-terms.model';
import type { IndianaOfferTerms } from '../state-contracts/indiana/models/indiana-offer-terms.model';
import type { AlabamaOfferTerms } from '../state-contracts/alabama/models/alabama-offer-terms.model';
import type { NewHampshireOfferTerms } from '../state-contracts/new-hampshire/models/new-hampshire-offer-terms.model';
import type { NebraskaOfferTerms } from '../state-contracts/nebraska/models/nebraska-offer-terms.model';
import type { MissouriOfferTerms } from '../state-contracts/missouri/models/missouri-offer-terms.model';
import type { OregonOfferTerms } from '../state-contracts/oregon/models/oregon-offer-terms.model';
import type { IdahoOfferTerms } from '../state-contracts/idaho/models/idaho-offer-terms.model';
import type { ArizonaOfferTerms } from '../state-contracts/arizona/models/arizona-offer-terms.model';
import type { MinnesotaOfferTerms } from '../state-contracts/minnesota/models/minnesota-offer-terms.model';
import type { MichiganOfferTerms } from '../state-contracts/michigan/models/michigan-offer-terms.model';
import type { SouthCarolinaOfferTerms } from '../state-contracts/south-carolina/models/south-carolina-offer-terms.model';
import type {
  NorthCarolinaOfferTerms,
} from '../state-contracts/north-carolina/models/north-carolina-offer-terms.model';
import type {
  CaliforniaOfferTerms
} from '../state-contracts/california/models/california-offer-terms.model';

import type {
  TexasOfferTerms,
} from '../state-contracts/texas/models/texas-offer-terms.model';
import type { ColoradoOfferTerms } from '../state-contracts/colorado/models/colorado-offer-terms.model';
import type { UtahOfferTerms } from '../state-contracts/utah/models/utah-offer-terms.model';
import type { WisconsinOfferTerms } from '../state-contracts/wisconsin/models/wisconsin-offer-terms.model';
import type { FloridaOfferTerms } from '../state-contracts/florida/models/florida-offer-terms.model';
import type { LouisianaOfferTerms } from '../state-contracts/louisiana/models/louisiana-offer-terms.model';

import type {
  OklahomaOfferTerms,
} from '../state-contracts/oklahoma/models/oklahoma-offer-terms.model';


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

  contractFacts?: {isCondominium: boolean | null; isDeveloperSale: boolean | null; isLeasehold: boolean | null; dwellingUnitCount: number | null};
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
  | TexasOfferTerms
  | OklahomaOfferTerms
  | UtahOfferTerms
  | WisconsinOfferTerms
  | MinnesotaOfferTerms
  | MichiganOfferTerms
  | IdahoOfferTerms
  | WyomingOfferTerms
  | MaineOfferTerms
  | MississippiOfferTerms
  | ArkansasOfferTerms
  | IllinoisOfferTerms
  | SouthDakotaOfferTerms
  | NewMexicoOfferTerms
  | MarylandOfferTerms
  | MontanaOfferTerms
  | IowaOfferTerms
  | WashingtonOfferTerms
  | DelawareOfferTerms
  | OhioOfferTerms
  | KansasOfferTerms
  | IndianaOfferTerms
  | AlabamaOfferTerms
  | NewHampshireOfferTerms
  | NebraskaOfferTerms
  | MissouriOfferTerms
  | OregonOfferTerms
  | ArizonaOfferTerms
  | FloridaOfferTerms
  | LouisianaOfferTerms
  | ColoradoOfferTerms
  | CaliforniaOfferTerms
  | SouthCarolinaOfferTerms;

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
