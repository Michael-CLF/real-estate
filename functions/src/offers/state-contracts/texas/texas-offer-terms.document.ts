import type {
  OfferPropertySnapshotDocument,
} from '../../offer-types';


export type TexasFinancingAddendumTypeDocument =
  | 'third_party_financing'
  | 'loan_assumption'
  | 'seller_financing';


export type TexasNaturalResourceLeaseStatusDocument =
  | 'unselected'
  | 'none'
  | 'delivered'
  | 'not_delivered';


export type TexasTitlePolicyExpensePayerDocument =
  | 'unselected'
  | 'buyer'
  | 'seller';


export type TexasBoundaryExceptionTreatmentDocument =
  | 'unselected'
  | 'not_amended_or_deleted'
  | 'amended_to_shortages_in_area';


export type TexasSurveySelectionDocument =
  | 'unselected'
  | 'seller_existing_survey'
  | 'buyer_new_survey'
  | 'seller_new_survey';


export type TexasDisclosureDeliveryStatusDocument =
  | 'unselected'
  | 'received'
  | 'not_received'
  | 'exempt';


export type TexasPropertyConditionAcceptanceDocument =
  | 'unselected'
  | 'as_is'
  | 'as_is_with_specific_repairs';


export type TexasPossessionSelectionDocument =
  | 'unselected'
  | 'upon_closing_and_funding'
  | 'temporary_residential_lease';


export type TexasContributionTypeDocument =
  | 'unselected'
  | 'none'
  | 'amount'
  | 'percentage';


export type TexasSpecialProvisionsPreparedByDocument =
  | 'buyer'
  | 'seller'
  | 'attorney';


export interface TexasOneToFourFamilyResaleFormDocument {
  formId: '20-19';

  formName:
    'One to Four Family Residential Contract (Resale)';

  effectiveDate: '2026-07-01';
  revisionDate: '2026-05-04';
}


export interface TexasCondominiumResaleFormDocument {
  formId: '30-18';
  formName:
    'Residential Condominium Contract (Resale)';
  effectiveDate: '2026-07-01';
  revisionDate: '2026-05-04';
}


export interface TexasNewHomeCompletedFormDocument {
  formId: '24-20';
  formName:
    'New Home Contract (Completed Construction)';
  effectiveDate: '2026-07-01';
  revisionDate: '2026-05-04';
}


export interface TexasNewHomeIncompleteFormDocument {
  formId: '23-20';
  formName:
    'New Home Contract (Incomplete Construction)';
  effectiveDate: '2026-07-01';
  revisionDate: '2026-05-04';
}


export interface TexasFarmAndRanchFormDocument {
  formId: '25-17';
  formName: 'Farm and Ranch Contract';
  effectiveDate: '2026-07-01';
  revisionDate: '2026-05-04';
}


export interface TexasUnimprovedPropertyFormDocument {
  formId: '9-18';
  formName: 'Unimproved Property Contract';
  effectiveDate: '2026-07-01';
  revisionDate: '2026-05-04';
}


export interface TexasPropertyIdentificationTermsDocument {
  lot?: string;
  block?: string;
  addition?: string;

  legalDescriptionExhibitDocumentUid?: string;
}


export interface TexasPropertyTermsDocument {
  exclusions?: string;

  mineralWaterTimberReservationApplies:
    boolean | null;

  reservationAddendumDocumentUid?: string;
}


export interface TexasSalesPriceTermsDocument {
  cashPortionInCents: number;
  financingInCents: number;
  salesPriceInCents: number;

  financingAddenda:
    TexasFinancingAddendumTypeDocument[];
}


export interface TexasLeaseTermsDocument {
  residentialLeasesExist: boolean | null;
  residentialLeasesReceived: boolean | null;
  residentialLeasesAddendumDocumentUid?: string;

  fixtureLeasesExist: boolean | null;
  fixtureLeasesReceived: boolean | null;
  fixtureLeasesAddendumDocumentUid?: string;

  naturalResourceLeasesExist: boolean | null;

  naturalResourceLeaseStatus:
    TexasNaturalResourceLeaseStatusDocument;

  naturalResourceLeaseDeliveryDays?: number;
  naturalResourceLeaseTerminationDays?: number;
}


export interface TexasEarnestMoneyOptionTermsDocument {
  escrowAgentName: string;
  escrowAgentAddress: string;

  earnestMoneyInCents: number;
  optionFeeInCents: number;

  additionalEarnestMoneyInCents?: number;
  additionalEarnestMoneyDeliveryDays?: number;

  optionPeriodDays?: number;
}


export interface TexasTitlePolicyTermsDocument {
  titleCompanyName: string;

  titlePolicyExpensePayer:
    TexasTitlePolicyExpensePayerDocument;

  boundaryExceptionTreatment:
    TexasBoundaryExceptionTreatmentDocument;

  boundaryAmendmentExpensePayer?:
    TexasTitlePolicyExpensePayerDocument;
}


export interface TexasSurveyTermsDocument {
  selection: TexasSurveySelectionDocument;
  deliveryDays: number;

  newSurveyIfExistingRejectedExpensePayer?:
    TexasTitlePolicyExpensePayerDocument;

  prohibitedUseOrActivity?: string;
  titleObjectionDays: number;
}


export interface TexasPropertyAssociationTermsDocument {
  mandatoryMembership: boolean | null;
  associationName?: string;
  duesInCents?: number;
  duesFrequency?: string;
  associationContact?: string;
  associationAddendumDocumentUid?: string;
}


export interface TexasDisclosureDeliveryTermsDocument {
  status: TexasDisclosureDeliveryStatusDocument;

  deliveryDays?: number;
  documentUid?: string;
}


export interface TexasSellerDisclosureTermsDocument {
  propertyCondition:
    TexasDisclosureDeliveryTermsDocument;

  waterRights:
    TexasDisclosureDeliveryTermsDocument;

  waterRightsExemptionConfirmed?: boolean;
  exemptWaterSupplierName?: string;

  leadBasedPaintApplies: boolean | null;
  leadBasedPaintAddendumDocumentUid?: string;
}


export interface TexasPropertyConditionTermsDocument {
  acceptance:
    TexasPropertyConditionAcceptanceDocument;

  /*
   * Party- or attorney-supplied text only. NavStreet must
   * not draft or recommend repair language.
   */
  partyProvidedRepairsAndTreatments?: string;

  residentialServiceContractReimbursementInCents?:
    number;
}


export interface TexasClosingPossessionTermsDocument {
  closingDate: string;

  possession:
    TexasPossessionSelectionDocument;

  temporaryResidentialLeaseDocumentUid?: string;
}


export interface TexasBrokerageContributionTermsDocument {
  contributionType:
    TexasContributionTypeDocument;

  amountInCents?: number;
  percentageOfSalesPrice?: number;
}


export interface TexasExpenseTermsDocument {
  sellerContributionToBuyerExpensesType:
    'unselected' | 'none' | 'amount';

  sellerContributionToBuyerExpensesInCents?: number;

  sellerContributionToBuyerBroker:
    TexasBrokerageContributionTermsDocument;

  buyerContributionToSellerBroker:
    TexasBrokerageContributionTermsDocument;
}


export interface TexasSpecialProvisionsTermsDocument {
  included: boolean;

  preparedBy?:
    TexasSpecialProvisionsPreparedByDocument;

  /*
   * Party- or attorney-supplied text only. NavStreet must
   * not generate this contract language.
   */
  partyProvidedText?: string;
}


export interface TexasNoticeContactDocument {
  addressLine1?: string;
  addressLine2?: string;

  city?: string;
  state?: string;
  zipCode?: string;

  phone?: string;
  email?: string;
}


export interface TexasNoticeTermsDocument {
  buyer: TexasNoticeContactDocument;
  seller: TexasNoticeContactDocument;

  buyerAgent?: TexasNoticeContactDocument;
  sellerAgent?: TexasNoticeContactDocument;
}


export interface TexasAttorneyContactDocument {
  name?: string;
  phone?: string;
  fax?: string;
  email?: string;
}


export interface TexasAttorneyTermsDocument {
  buyerAttorney?: TexasAttorneyContactDocument;
  sellerAttorney?: TexasAttorneyContactDocument;
}


export interface TexasAddendumSelectionDocument {
  formId: string;
  title: string;
  included: boolean;

  documentUid?: string;
}


export interface TexasOfferDeliveryTermsDocument {
  expiresAt: string;

  /*
   * Texas uses Central and Mountain time. The value must
   * be derived from the property's actual location.
   */
  timeZone:
    | 'America/Chicago'
    | 'America/Denver';

  electronicDeliveryAuthorized:
    boolean | null;
}


export type TexasDocumentDeliveryStatusDocument =
  | 'unselected'
  | 'received'
  | 'not_received'
  | 'waived';


export interface TexasCondominiumPropertyTermsDocument {
  unitNumber: string;
  buildingNumber?: string;
  condominiumProjectName: string;
  parkingAreas?: string;

  exclusions?: string;

  condominiumDocumentsStatus:
    TexasDocumentDeliveryStatusDocument;
  condominiumDocumentsDeliveryDays?: number;

  resaleCertificateStatus:
    TexasDocumentDeliveryStatusDocument;
  resaleCertificateDeliveryDays?: number;
  resaleCertificateDocumentUid?: string;

  rightOfRefusalCertificationDays?: number;
}


export type TexasConstructionDocumentStatusDocument =
  | 'unselected'
  | 'received'
  | 'not_received';


export interface TexasNewHomeConstructionTermsDocument {
  constructionComplete: boolean;

  plansAndSpecificationsStatus:
    TexasConstructionDocumentStatusDocument;
  plansAndSpecificationsDocumentUid?: string;

  buyerSelectionDocumentsStatus:
    TexasConstructionDocumentStatusDocument;
  buyerSelectionDocumentsUid?: string;

  constructionDocumentsDeliveryDays?: number;
  buyerSelectionDeadlineDays?: number;

  anticipatedCompletionDate?: string;

  builderWarrantyDocumentUid?: string;
  thirdPartyWarrantyDocumentUid?: string;

  certificateOfOccupancyRequired:
    boolean | null;
}


export interface TexasFarmAndRanchPropertyTermsDocument {
  landDescription: string;
  approximateAcreage?: number;

  improvementsDescription?: string;
  accessoriesDescription?: string;
  cropsDescription?: string;

  exclusions?: string;

  reservationsApply: boolean | null;
  reservationAddendumDocumentUid?: string;

  existingAgriculturalLeasesExist:
    boolean | null;
  agriculturalLeaseDocumentsDelivered:
    boolean | null;

  rollbackTaxesExpensePayer:
    TexasTitlePolicyExpensePayerDocument;
}


export interface TexasUnimprovedPropertyTermsDocument {
  lot?: string;
  block?: string;
  addition?: string;

  metesAndBoundsDescription?: string;
  legalDescriptionExhibitDocumentUid?: string;

  intendedUse?: string;

  reservationsApply: boolean | null;
  reservationAddendumDocumentUid?: string;

  feasibilityPeriodDays?: number;
  feasibilityFeeInCents?: number;

  utilitiesAvailable:
    boolean | null;
  utilityInformation?: string;
}


export interface TexasSharedContractSectionsDocument {
  salesPrice:
    TexasSalesPriceTermsDocument;

  earnestMoneyAndOption:
    TexasEarnestMoneyOptionTermsDocument;

  titlePolicy:
    TexasTitlePolicyTermsDocument;

  propertyCondition:
    TexasPropertyConditionTermsDocument;

  closingAndPossession:
    TexasClosingPossessionTermsDocument;

  expenses: TexasExpenseTermsDocument;

  brokerOrSalesAgentDisclosure?: string;

  specialProvisions:
    TexasSpecialProvisionsTermsDocument;

  notices: TexasNoticeTermsDocument;
  attorneys: TexasAttorneyTermsDocument;

  addenda: TexasAddendumSelectionDocument[];

  delivery: TexasOfferDeliveryTermsDocument;
}


/* Backend document shape for TREC 20-19 resale terms. */
export interface TexasOneToFourFamilyResaleOfferTermsDocument {
  stateCode: 'TX';

  contractType:
    'one_to_four_family_resale';

  form:
    TexasOneToFourFamilyResaleFormDocument;

  property:
    OfferPropertySnapshotDocument;

  propertyIdentification:
    TexasPropertyIdentificationTermsDocument;

  propertyTerms:
    TexasPropertyTermsDocument;

  salesPrice:
    TexasSalesPriceTermsDocument;

  leases: TexasLeaseTermsDocument;

  earnestMoneyAndOption:
    TexasEarnestMoneyOptionTermsDocument;

  titlePolicy:
    TexasTitlePolicyTermsDocument;

  survey: TexasSurveyTermsDocument;

  propertyAssociation:
    TexasPropertyAssociationTermsDocument;

  disclosures:
    TexasSellerDisclosureTermsDocument;

  propertyCondition:
    TexasPropertyConditionTermsDocument;

  closingAndPossession:
    TexasClosingPossessionTermsDocument;

  expenses: TexasExpenseTermsDocument;

  brokerOrSalesAgentDisclosure?: string;

  specialProvisions:
    TexasSpecialProvisionsTermsDocument;

  notices: TexasNoticeTermsDocument;
  attorneys: TexasAttorneyTermsDocument;

  addenda: TexasAddendumSelectionDocument[];

  delivery: TexasOfferDeliveryTermsDocument;
}


export interface TexasCondominiumResaleOfferTermsDocument
  extends TexasSharedContractSectionsDocument {
  stateCode: 'TX';
  contractType: 'condominium_resale';

  form: TexasCondominiumResaleFormDocument;

  property:
    OfferPropertySnapshotDocument;

  condominiumProperty:
    TexasCondominiumPropertyTermsDocument;

  propertyTerms:
    TexasPropertyTermsDocument;

  leases: TexasLeaseTermsDocument;

  disclosures:
    TexasSellerDisclosureTermsDocument;
}


export interface TexasNewHomeCompletedOfferTermsDocument
  extends TexasSharedContractSectionsDocument {
  stateCode: 'TX';
  contractType: 'new_home_completed';

  form: TexasNewHomeCompletedFormDocument;

  property:
    OfferPropertySnapshotDocument;

  propertyIdentification:
    TexasPropertyIdentificationTermsDocument;

  propertyTerms:
    TexasPropertyTermsDocument;

  construction:
    TexasNewHomeConstructionTermsDocument & {
      constructionComplete: true;
    };

  survey: TexasSurveyTermsDocument;

  propertyAssociation:
    TexasPropertyAssociationTermsDocument;
}


export interface TexasNewHomeIncompleteOfferTermsDocument
  extends TexasSharedContractSectionsDocument {
  stateCode: 'TX';
  contractType: 'new_home_incomplete';

  form: TexasNewHomeIncompleteFormDocument;

  property:
    OfferPropertySnapshotDocument;

  propertyIdentification:
    TexasPropertyIdentificationTermsDocument;

  propertyTerms:
    TexasPropertyTermsDocument;

  construction:
    TexasNewHomeConstructionTermsDocument & {
      constructionComplete: false;
    };

  survey: TexasSurveyTermsDocument;

  propertyAssociation:
    TexasPropertyAssociationTermsDocument;
}


export interface TexasFarmAndRanchOfferTermsDocument
  extends TexasSharedContractSectionsDocument {
  stateCode: 'TX';
  contractType: 'farm_and_ranch';

  form: TexasFarmAndRanchFormDocument;

  property:
    OfferPropertySnapshotDocument;

  farmAndRanchProperty:
    TexasFarmAndRanchPropertyTermsDocument;

  leases: TexasLeaseTermsDocument;
  survey: TexasSurveyTermsDocument;

  disclosures:
    TexasSellerDisclosureTermsDocument;
}


export interface TexasUnimprovedPropertyOfferTermsDocument
  extends TexasSharedContractSectionsDocument {
  stateCode: 'TX';
  contractType: 'unimproved_property';

  form: TexasUnimprovedPropertyFormDocument;

  property:
    OfferPropertySnapshotDocument;

  unimprovedProperty:
    TexasUnimprovedPropertyTermsDocument;

  survey: TexasSurveyTermsDocument;

  propertyAssociation:
    TexasPropertyAssociationTermsDocument;
}


export type TexasOfferTermsDocument =
  | TexasOneToFourFamilyResaleOfferTermsDocument
  | TexasCondominiumResaleOfferTermsDocument
  | TexasNewHomeCompletedOfferTermsDocument
  | TexasNewHomeIncompleteOfferTermsDocument
  | TexasFarmAndRanchOfferTermsDocument
  | TexasUnimprovedPropertyOfferTermsDocument;
