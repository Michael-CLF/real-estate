import {
  OfferIdentityStatus,
  OfferSignerStatus
} from './offer-status.model';


/*
 * Role performed by a participant in an offer.
 */
export type OfferPartyRole =
  | 'buyer'
  | 'seller';


/*
 * Legal ownership or purchasing capacity selected by a
 * buyer or seller.
 */
export type OfferPartyCapacity =
  | 'individual'
  | 'joint'
  | 'trust'
  | 'estate'
  | 'corporation'
  | 'limited_liability_company'
  | 'partnership'
  | 'other';


/*
 * Intended use of the property by a buyer.
 */
export type BuyerIntendedUse =
  | 'primary_residence'
  | 'second_home'
  | 'investment_property'
  | 'other';


/*
 * Mailing address for an offer participant.
 */
export interface OfferPartyAddress {
  addressLine1: string;
  addressLine2?: string;

  city: string;
  state: string;
  zipCode: string;
  country: string;
}


/*
 * Identity-verification information retained by NavStreet.
 *
 * Sensitive identity documents, document images and
 * government identification numbers must not be stored
 * in this model.
 */
export interface OfferPartyIdentityVerification {
  status: OfferIdentityStatus;

  provider: 'stripe_identity';

  /*
   * Stripe Verification Session identifier.
   *
   * This is stored for server-side verification and audit
   * purposes. The single-use verification URL and client
   * secret must never be stored here.
   */
  providerVerificationUid?: string;

  verifiedFirstName?: string;
  verifiedMiddleName?: string;
  verifiedLastName?: string;

  verifiedAt?: Date;

  /*
   * Indicates whether the verified legal name has been
   * copied into and locked on the offer.
   */
  legalNameApplied: boolean;
}


/*
 * Electronic-signature state for one required signer.
 *
 * Provider-specific signature request identifiers are
 * optional until the e-signature provider is connected.
 */
export interface OfferPartySignature {
  required: boolean;
  status: OfferSignerStatus;

  providerEnvelopeUid?: string;
  providerSignerUid?: string;

  invitedAt?: Date;
  viewedAt?: Date;
  signedAt?: Date;
  declinedAt?: Date;
}


/*
 * Buyer-specific information that does not apply to a
 * seller.
 */
export interface OfferBuyerDetails {
  intendedUse: BuyerIntendedUse;

  /*
   * Name in which the buyer proposes that the deed be
   * prepared.
   */
  proposedDeedName: string;

  /*
   * Indicates the order in which multiple buyers appear.
   */
  buyerSequence: number;

  primaryBuyer: boolean;
}


/*
 * Seller-specific information.
 */
export interface OfferSellerDetails {
  /*
   * Indicates the order in which multiple sellers appear.
   */
  sellerSequence: number;

  primarySeller: boolean;

  /*
   * The seller associated with the published listing.
   */
  listingOwner: boolean;
}


/*
 * Represents one buyer or seller participating in an offer.
 *
 * Every required signer must have a separate OfferParty.
 * One participant must never sign on behalf of another
 * participant unless legally authorized outside this model.
 */
export interface OfferParty {
  Uid: string;

  role: OfferPartyRole;
  capacity: OfferPartyCapacity;

  /*
   * NavStreet/Firebase authenticated-user UID.
   *
   * Additional parties may initially be invited before
   * their NavStreet account is connected.
   */
  userUid?: string;

  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;

  /*
   * Complete legal name shown on the agreement.
   */
  legalName: string;

  email: string;
  phone: string;

  mailingAddress: OfferPartyAddress;

  buyerDetails?: OfferBuyerDetails;
  sellerDetails?: OfferSellerDetails;

  identityVerification:
    OfferPartyIdentityVerification;

  signature: OfferPartySignature;

  /*
   * Records the participant's consent to receive and sign
   * transaction documents electronically.
   */
  electronicTransactionsConsentAccepted: boolean;
  electronicTransactionsConsentAcceptedAt?: Date;

  /*
   * Audit timestamps for this participant record.
   */
  createdAt: Date;
  updatedAt: Date;
}


/*
 * Data required when initially adding a buyer to an offer.
 */
export type InitialOfferBuyer = Omit<
  OfferParty,
  | 'Uid'
  | 'role'
  | 'sellerDetails'
  | 'identityVerification'
  | 'signature'
  | 'electronicTransactionsConsentAccepted'
  | 'electronicTransactionsConsentAcceptedAt'
  | 'createdAt'
  | 'updatedAt'
>;


/*
 * Data required when initially adding a seller to an offer.
 */
export type InitialOfferSeller = Omit<
  OfferParty,
  | 'Uid'
  | 'role'
  | 'buyerDetails'
  | 'identityVerification'
  | 'signature'
  | 'electronicTransactionsConsentAccepted'
  | 'electronicTransactionsConsentAcceptedAt'
  | 'createdAt'
  | 'updatedAt'
>;