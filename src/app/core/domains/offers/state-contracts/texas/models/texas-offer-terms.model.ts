import type {
  MoneyInCents,
  OfferDate,
  OfferDateTime,
  OfferPropertySnapshot,
} from '../../../models/offer-terms.model';


export type TexasFinancingAddendumType =
  | 'third_party_financing'
  | 'loan_assumption'
  | 'seller_financing';


export type TexasNaturalResourceLeaseStatus =
  | 'unselected'
  | 'none'
  | 'delivered'
  | 'not_delivered';


export type TexasTitlePolicyExpensePayer =
  | 'unselected'
  | 'buyer'
  | 'seller';


export type TexasBoundaryExceptionTreatment =
  | 'unselected'
  | 'not_amended_or_deleted'
  | 'amended_to_shortages_in_area';


export type TexasSurveySelection =
  | 'unselected'
  | 'seller_existing_survey'
  | 'buyer_new_survey'
  | 'seller_new_survey';


export type TexasDisclosureDeliveryStatus =
  | 'unselected'
  | 'received'
  | 'not_received'
  | 'exempt';


export type TexasPropertyConditionAcceptance =
  | 'unselected'
  | 'as_is'
  | 'as_is_with_specific_repairs';


export type TexasPossessionSelection =
  | 'unselected'
  | 'upon_closing_and_funding'
  | 'temporary_residential_lease';


export type TexasContributionType =
  | 'unselected'
  | 'none'
  | 'amount'
  | 'percentage';


export type TexasSpecialProvisionsPreparedBy =
  | 'buyer'
  | 'seller'
  | 'attorney';


export interface TexasOneToFourFamilyResaleFormReference {
  readonly formId: '20-19';
  readonly formName:
    'One to Four Family Residential Contract (Resale)';
  readonly effectiveDate: '2026-07-01';
  readonly revisionDate: '2026-05-04';
}


export interface TexasPropertyIdentificationTerms {
  lot?: string;
  block?: string;
  addition?: string;

  legalDescriptionExhibitDocumentUid?: string;
}


export interface TexasPropertyTerms {
  exclusions?: string;

  mineralWaterTimberReservationApplies:
    boolean | null;
  reservationAddendumDocumentUid?: string;
}


export interface TexasSalesPriceTerms {
  cashPortionInCents: MoneyInCents;
  financingInCents: MoneyInCents;
  salesPriceInCents: MoneyInCents;

  financingAddenda:
    TexasFinancingAddendumType[];
}


export interface TexasLeaseTerms {
  residentialLeasesExist: boolean | null;
  residentialLeasesReceived: boolean | null;
  residentialLeasesAddendumDocumentUid?: string;

  fixtureLeasesExist: boolean | null;
  fixtureLeasesReceived: boolean | null;
  fixtureLeasesAddendumDocumentUid?: string;

  naturalResourceLeasesExist: boolean | null;

  naturalResourceLeaseStatus:
    TexasNaturalResourceLeaseStatus;

  naturalResourceLeaseDeliveryDays?: number;
  naturalResourceLeaseTerminationDays?: number;
}


export interface TexasEarnestMoneyOptionTerms {
  escrowAgentName: string;
  escrowAgentAddress: string;

  earnestMoneyInCents: MoneyInCents;
  optionFeeInCents: MoneyInCents;

  additionalEarnestMoneyInCents?:
    MoneyInCents;

  additionalEarnestMoneyDeliveryDays?:
    number;

  optionPeriodDays?: number;
}


export interface TexasTitlePolicyTerms {
  titleCompanyName: string;

  titlePolicyExpensePayer:
    TexasTitlePolicyExpensePayer;

  boundaryExceptionTreatment:
    TexasBoundaryExceptionTreatment;

  boundaryAmendmentExpensePayer?:
    TexasTitlePolicyExpensePayer;
}


export interface TexasSurveyTerms {
  selection: TexasSurveySelection;
  deliveryDays: number;

  newSurveyIfExistingRejectedExpensePayer?:
    TexasTitlePolicyExpensePayer;

  prohibitedUseOrActivity?: string;
  titleObjectionDays: number;
}


export interface TexasPropertyAssociationTerms {
  mandatoryMembership: boolean | null;
  associationName?: string;
  duesInCents?: MoneyInCents;
  duesFrequency?: string;
  associationContact?: string;
  associationAddendumDocumentUid?: string;
}


export interface TexasDisclosureDeliveryTerms {
  status: TexasDisclosureDeliveryStatus;
  deliveryDays?: number;
  documentUid?: string;
}


export interface TexasSellerDisclosureTerms {
  propertyCondition:
    TexasDisclosureDeliveryTerms;

  waterRights:
    TexasDisclosureDeliveryTerms;

  waterRightsExemptionConfirmed?: boolean;
  exemptWaterSupplierName?: string;

  leadBasedPaintApplies: boolean | null;
  leadBasedPaintAddendumDocumentUid?: string;
}


export interface TexasPropertyConditionTerms {
  acceptance:
    TexasPropertyConditionAcceptance;

  /*
   * Text supplied by a party for the specific-repairs
   * blank. NavStreet must not generate this language.
   */
  partyProvidedRepairsAndTreatments?: string;

  residentialServiceContractReimbursementInCents?:
    MoneyInCents;
}


export interface TexasClosingPossessionTerms {
  closingDate: OfferDate;

  possession:
    TexasPossessionSelection;

  temporaryResidentialLeaseDocumentUid?: string;
}


export interface TexasBrokerageContributionTerms {
  contributionType:
    TexasContributionType;

  amountInCents?: MoneyInCents;
  percentageOfSalesPrice?: number;
}


export interface TexasExpenseTerms {
  sellerContributionToBuyerExpensesType:
    'unselected' | 'none' | 'amount';

  sellerContributionToBuyerExpensesInCents?:
    MoneyInCents;

  sellerContributionToBuyerBroker:
    TexasBrokerageContributionTerms;

  buyerContributionToSellerBroker:
    TexasBrokerageContributionTerms;
}


export interface TexasSpecialProvisionsTerms {
  included: boolean;

  preparedBy?:
    TexasSpecialProvisionsPreparedBy;

  /*
   * Party- or attorney-supplied text only. NavStreet must
   * not draft or recommend special provisions.
   */
  partyProvidedText?: string;
}


export interface TexasNoticeContact {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  phone?: string;
  email?: string;
}


export interface TexasNoticeTerms {
  buyer: TexasNoticeContact;
  seller: TexasNoticeContact;

  buyerAgent?: TexasNoticeContact;
  sellerAgent?: TexasNoticeContact;
}


export interface TexasAttorneyContact {
  name?: string;
  phone?: string;
  fax?: string;
  email?: string;
}


export interface TexasAttorneyTerms {
  buyerAttorney?: TexasAttorneyContact;
  sellerAttorney?: TexasAttorneyContact;
}


export interface TexasAddendumSelection {
  formId: string;
  title: string;
  included: boolean;
  documentUid?: string;
}


export interface TexasOfferDeliveryTerms {
  expiresAt: OfferDateTime;

  /*
   * Derived from the property's actual location because
   * Texas spans Central and Mountain time zones.
   */
  timeZone: string;

  electronicDeliveryAuthorized:
    boolean | null;
}


/*
 * Initial Texas vertical slice: TREC 20-19 resale.
 *
 * The other Texas contract models will be added to the
 * TexasOfferTerms union as their implementations become
 * available.
 */
export interface TexasOneToFourFamilyResaleOfferTerms {
  stateCode: 'TX';
  contractType:
    'one_to_four_family_resale';

  form:
    TexasOneToFourFamilyResaleFormReference;

  property: OfferPropertySnapshot;

  propertyIdentification:
    TexasPropertyIdentificationTerms;

  propertyTerms: TexasPropertyTerms;
  salesPrice: TexasSalesPriceTerms;
  leases: TexasLeaseTerms;

  earnestMoneyAndOption:
    TexasEarnestMoneyOptionTerms;

  titlePolicy: TexasTitlePolicyTerms;
  survey: TexasSurveyTerms;

  propertyAssociation:
    TexasPropertyAssociationTerms;

  disclosures: TexasSellerDisclosureTerms;

  propertyCondition:
    TexasPropertyConditionTerms;

  closingAndPossession:
    TexasClosingPossessionTerms;

  expenses: TexasExpenseTerms;

  brokerOrSalesAgentDisclosure?: string;

  specialProvisions:
    TexasSpecialProvisionsTerms;

  notices: TexasNoticeTerms;
  attorneys: TexasAttorneyTerms;

  addenda: TexasAddendumSelection[];

  delivery: TexasOfferDeliveryTerms;
}


export type TexasOfferTerms =
  TexasOneToFourFamilyResaleOfferTerms;
