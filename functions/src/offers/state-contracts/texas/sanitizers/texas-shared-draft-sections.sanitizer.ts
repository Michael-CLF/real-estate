import type {
  TexasAddendumSelectionDocument,
  TexasAttorneyContactDocument,
  TexasBrokerageContributionTermsDocument,
  TexasDisclosureDeliveryTermsDocument,
  TexasLeaseTermsDocument,
  TexasNoticeContactDocument,
  TexasPropertyAssociationTermsDocument,
  TexasPropertyIdentificationTermsDocument,
  TexasPropertyTermsDocument,
  TexasSellerDisclosureTermsDocument,
  TexasOneToFourFamilyResaleOfferTermsDocument,
  TexasSpecialProvisionsPreparedByDocument,
  TexasSurveyTermsDocument,
} from '../texas-offer-terms.document';

import {
  booleanValue,
  enumArray,
  enumValue,
  nonNegativeInteger,
  nullableBoolean,
  optionalBoolean,
  optionalEnumValue,
  optionalIdentifier,
  optionalNonNegativeInteger,
  optionalNumber,
  optionalText,
  owns,
  section,
  text,
} from './texas-draft-sanitizer.utils';


type TexasSharedContractSectionsDocument =
  Pick<
    TexasOneToFourFamilyResaleOfferTermsDocument,
    | 'salesPrice'
    | 'earnestMoneyAndOption'
    | 'titlePolicy'
    | 'propertyCondition'
    | 'closingAndPossession'
    | 'expenses'
    | 'brokerOrSalesAgentDisclosure'
    | 'specialProvisions'
    | 'notices'
    | 'attorneys'
    | 'addenda'
    | 'delivery'
  >;

import type {
  UnknownRecord,
} from './texas-draft-sanitizer.utils';


export interface SanitizeTexasSharedSectionsInput {
  requested: UnknownRecord;
  current: TexasSharedContractSectionsDocument;
  initiatedBy: 'buyer' | 'seller';
}


export function sanitizeTexasSharedSections(
  input: SanitizeTexasSharedSectionsInput
): TexasSharedContractSectionsDocument {
  const requested = input.requested;
  const current = input.current;

  const salesPrice = section(requested, 'salesPrice');
  const money = section(requested, 'earnestMoneyAndOption');
  const title = section(requested, 'titlePolicy');
  const condition = section(requested, 'propertyCondition');
  const closing = section(requested, 'closingAndPossession');
  const expenses = section(requested, 'expenses');
  const provisions = section(requested, 'specialProvisions');
  const notices = section(requested, 'notices');
  const attorneys = section(requested, 'attorneys');
  const delivery = section(requested, 'delivery');

  return {
    salesPrice: {
      cashPortionInCents: nonNegativeInteger(
        salesPrice,
        'cashPortionInCents',
        current.salesPrice.cashPortionInCents
      ),
      financingInCents: nonNegativeInteger(
        salesPrice,
        'financingInCents',
        current.salesPrice.financingInCents
      ),
      salesPriceInCents: nonNegativeInteger(
        salesPrice,
        'salesPriceInCents',
        current.salesPrice.salesPriceInCents
      ),
      financingAddenda: enumArray(
        salesPrice,
        'financingAddenda',
        current.salesPrice.financingAddenda,
        [
          'third_party_financing',
          'loan_assumption',
          'seller_financing',
        ] as const
      ),
    },

    earnestMoneyAndOption: {
      escrowAgentName: text(
        money,
        'escrowAgentName',
        current.earnestMoneyAndOption.escrowAgentName,
        300
      ),
      escrowAgentAddress: text(
        money,
        'escrowAgentAddress',
        current.earnestMoneyAndOption.escrowAgentAddress,
        500
      ),
      earnestMoneyInCents: nonNegativeInteger(
        money,
        'earnestMoneyInCents',
        current.earnestMoneyAndOption.earnestMoneyInCents
      ),
      optionFeeInCents: nonNegativeInteger(
        money,
        'optionFeeInCents',
        current.earnestMoneyAndOption.optionFeeInCents
      ),
      additionalEarnestMoneyInCents:
        optionalNonNegativeInteger(
          money,
          'additionalEarnestMoneyInCents',
          current.earnestMoneyAndOption
            .additionalEarnestMoneyInCents
        ),
      additionalEarnestMoneyDeliveryDays:
        optionalNonNegativeInteger(
          money,
          'additionalEarnestMoneyDeliveryDays',
          current.earnestMoneyAndOption
            .additionalEarnestMoneyDeliveryDays
        ),
      optionPeriodDays: optionalNonNegativeInteger(
        money,
        'optionPeriodDays',
        current.earnestMoneyAndOption.optionPeriodDays
      ),
    },

    titlePolicy: {
      titleCompanyName: text(
        title,
        'titleCompanyName',
        current.titlePolicy.titleCompanyName,
        300
      ),
      titlePolicyExpensePayer: enumValue(
        title,
        'titlePolicyExpensePayer',
        current.titlePolicy.titlePolicyExpensePayer,
        ['unselected', 'buyer', 'seller'] as const
      ),
      boundaryExceptionTreatment: enumValue(
        title,
        'boundaryExceptionTreatment',
        current.titlePolicy.boundaryExceptionTreatment,
        [
          'unselected',
          'not_amended_or_deleted',
          'amended_to_shortages_in_area',
        ] as const
      ),
      boundaryAmendmentExpensePayer: optionalEnumValue(
        title,
        'boundaryAmendmentExpensePayer',
        current.titlePolicy.boundaryAmendmentExpensePayer,
        ['unselected', 'buyer', 'seller'] as const
      ),
    },

    propertyCondition: {
      acceptance: enumValue(
        condition,
        'acceptance',
        current.propertyCondition.acceptance,
        [
          'unselected',
          'as_is',
          'as_is_with_specific_repairs',
        ] as const
      ),
      partyProvidedRepairsAndTreatments: optionalText(
        condition,
        'partyProvidedRepairsAndTreatments',
        current.propertyCondition
          .partyProvidedRepairsAndTreatments,
        10000
      ),
      residentialServiceContractReimbursementInCents:
        optionalNonNegativeInteger(
          condition,
          'residentialServiceContractReimbursementInCents',
          current.propertyCondition
            .residentialServiceContractReimbursementInCents
        ),
    },

    closingAndPossession: {
      closingDate: text(
        closing,
        'closingDate',
        current.closingAndPossession.closingDate,
        10
      ),
      possession: enumValue(
        closing,
        'possession',
        current.closingAndPossession.possession,
        [
          'unselected',
          'upon_closing_and_funding',
          'temporary_residential_lease',
        ] as const
      ),
      temporaryResidentialLeaseDocumentUid: optionalIdentifier(
        closing,
        'temporaryResidentialLeaseDocumentUid',
        current.closingAndPossession
          .temporaryResidentialLeaseDocumentUid
      ),
    },

    expenses: {
      sellerContributionToBuyerExpensesType:
        enumValue(
          expenses,
          'sellerContributionToBuyerExpensesType',
          current.expenses.sellerContributionToBuyerExpensesType ??
            'unselected',
          ['unselected', 'none', 'amount'] as const
        ),
      sellerContributionToBuyerExpensesInCents:
        optionalNonNegativeInteger(
          expenses,
          'sellerContributionToBuyerExpensesInCents',
          current.expenses
            .sellerContributionToBuyerExpensesInCents
        ),
      sellerContributionToBuyerBroker:
        sanitizeBrokerageContribution(
          expenses,
          'sellerContributionToBuyerBroker',
          current.expenses.sellerContributionToBuyerBroker
        ),
      buyerContributionToSellerBroker:
        sanitizeBrokerageContribution(
          expenses,
          'buyerContributionToSellerBroker',
          current.expenses.buyerContributionToSellerBroker
        ),
    },

    brokerOrSalesAgentDisclosure: optionalText(
      requested,
      'brokerOrSalesAgentDisclosure',
      current.brokerOrSalesAgentDisclosure,
      10000
    ),

    specialProvisions: sanitizeSpecialProvisions(
      provisions,
      current.specialProvisions,
      input.initiatedBy
    ),

    notices: {
      buyer: sanitizeNoticeContact(
        notices,
        'buyer',
        current.notices.buyer
      ),
      seller: sanitizeNoticeContact(
        notices,
        'seller',
        current.notices.seller
      ),
      buyerAgent: sanitizeOptionalNoticeContact(
        notices,
        'buyerAgent',
        current.notices.buyerAgent
      ),
      sellerAgent: sanitizeOptionalNoticeContact(
        notices,
        'sellerAgent',
        current.notices.sellerAgent
      ),
    },

    attorneys: {
      buyerAttorney: sanitizeOptionalAttorneyContact(
        attorneys,
        'buyerAttorney',
        current.attorneys.buyerAttorney
      ),
      sellerAttorney: sanitizeOptionalAttorneyContact(
        attorneys,
        'sellerAttorney',
        current.attorneys.sellerAttorney
      ),
    },

    addenda: sanitizeApprovedAddenda(
      requested,
      current.addenda
    ),

    delivery: {
      expiresAt: text(
        delivery,
        'expiresAt',
        current.delivery.expiresAt,
        100
      ),
      timeZone: current.delivery.timeZone,
      electronicDeliveryAuthorized: nullableBoolean(
        delivery,
        'electronicDeliveryAuthorized',
        current.delivery.electronicDeliveryAuthorized
      ),
    },
  };
}


export function sanitizePropertyIdentification(
  requested: UnknownRecord,
  current: TexasPropertyIdentificationTermsDocument
): TexasPropertyIdentificationTermsDocument {
  return {
    lot: optionalText(requested, 'lot', current.lot, 200),
    block: optionalText(requested, 'block', current.block, 200),
    addition: optionalText(requested, 'addition', current.addition, 500),
    legalDescriptionExhibitDocumentUid: optionalIdentifier(
      requested,
      'legalDescriptionExhibitDocumentUid',
      current.legalDescriptionExhibitDocumentUid
    ),
  };
}


export function sanitizePropertyTerms(
  requested: UnknownRecord,
  current: TexasPropertyTermsDocument
): TexasPropertyTermsDocument {
  return {
    exclusions: optionalText(
      requested,
      'exclusions',
      current.exclusions,
      5000
    ),
    mineralWaterTimberReservationApplies: nullableBoolean(
      requested,
      'mineralWaterTimberReservationApplies',
      current.mineralWaterTimberReservationApplies
    ),
    reservationAddendumDocumentUid: optionalIdentifier(
      requested,
      'reservationAddendumDocumentUid',
      current.reservationAddendumDocumentUid
    ),
  };
}


export function sanitizeLeaseTerms(
  requested: UnknownRecord,
  current: TexasLeaseTermsDocument
): TexasLeaseTermsDocument {
  return {
    residentialLeasesExist:
      current.residentialLeasesExist,
    residentialLeasesReceived: nullableBoolean(
      requested,
      'residentialLeasesReceived',
      current.residentialLeasesReceived
    ),
    residentialLeasesAddendumDocumentUid: optionalIdentifier(
      requested,
      'residentialLeasesAddendumDocumentUid',
      current.residentialLeasesAddendumDocumentUid
    ),
    fixtureLeasesExist:
      current.fixtureLeasesExist,
    fixtureLeasesReceived: nullableBoolean(
      requested,
      'fixtureLeasesReceived',
      current.fixtureLeasesReceived
    ),
    fixtureLeasesAddendumDocumentUid: optionalIdentifier(
      requested,
      'fixtureLeasesAddendumDocumentUid',
      current.fixtureLeasesAddendumDocumentUid
    ),
    naturalResourceLeasesExist:
      current.naturalResourceLeasesExist,
    naturalResourceLeaseStatus: enumValue(
      requested,
      'naturalResourceLeaseStatus',
      current.naturalResourceLeaseStatus,
      [
        'unselected',
        'none',
        'delivered',
        'not_delivered',
      ] as const
    ),
    naturalResourceLeaseDeliveryDays: optionalNonNegativeInteger(
      requested,
      'naturalResourceLeaseDeliveryDays',
      current.naturalResourceLeaseDeliveryDays
    ),
    naturalResourceLeaseTerminationDays: optionalNonNegativeInteger(
      requested,
      'naturalResourceLeaseTerminationDays',
      current.naturalResourceLeaseTerminationDays
    ),
  };
}


export function sanitizeSurveyTerms(
  requested: UnknownRecord,
  current: TexasSurveyTermsDocument
): TexasSurveyTermsDocument {
  return {
    selection: enumValue(
      requested,
      'selection',
      current.selection,
      [
        'unselected',
        'seller_existing_survey',
        'buyer_new_survey',
        'seller_new_survey',
      ] as const
    ),
    deliveryDays: nonNegativeInteger(
      requested,
      'deliveryDays',
      current.deliveryDays
    ),
    newSurveyIfExistingRejectedExpensePayer: optionalEnumValue(
      requested,
      'newSurveyIfExistingRejectedExpensePayer',
      current.newSurveyIfExistingRejectedExpensePayer,
      ['unselected', 'buyer', 'seller'] as const
    ),
    prohibitedUseOrActivity: optionalText(
      requested,
      'prohibitedUseOrActivity',
      current.prohibitedUseOrActivity,
      5000
    ),
    titleObjectionDays: nonNegativeInteger(
      requested,
      'titleObjectionDays',
      current.titleObjectionDays
    ),
  };
}


export function sanitizePropertyAssociationTerms(
  requested: UnknownRecord,
  current: TexasPropertyAssociationTermsDocument
): TexasPropertyAssociationTermsDocument {
  return {
    mandatoryMembership: nullableBoolean(
      requested,
      'mandatoryMembership',
      current.mandatoryMembership
    ),
    associationAddendumDocumentUid: optionalIdentifier(
      requested,
      'associationAddendumDocumentUid',
      current.associationAddendumDocumentUid
    ),
  };
}


export function sanitizeDisclosureTerms(
  requested: UnknownRecord,
  current: TexasSellerDisclosureTermsDocument
): TexasSellerDisclosureTermsDocument {
  return {
    propertyCondition: sanitizeDisclosure(
      requested,
      'propertyCondition',
      current.propertyCondition
    ),
    waterRights: sanitizeDisclosure(
      requested,
      'waterRights',
      current.waterRights
    ),
    waterRightsExemptionConfirmed: optionalBoolean(
      requested,
      'waterRightsExemptionConfirmed',
      current.waterRightsExemptionConfirmed
    ),
    exemptWaterSupplierName: optionalText(
      requested,
      'exemptWaterSupplierName',
      current.exemptWaterSupplierName,
      500
    ),
    leadBasedPaintApplies: nullableBoolean(
      requested,
      'leadBasedPaintApplies',
      current.leadBasedPaintApplies
    ),
    leadBasedPaintAddendumDocumentUid: optionalIdentifier(
      requested,
      'leadBasedPaintAddendumDocumentUid',
      current.leadBasedPaintAddendumDocumentUid
    ),
  };
}


function sanitizeDisclosure(
  parent: UnknownRecord,
  fieldName: string,
  current: TexasDisclosureDeliveryTermsDocument
): TexasDisclosureDeliveryTermsDocument {
  const requested = section(parent, fieldName);

  return {
    status: enumValue(
      requested,
      'status',
      current.status,
      [
        'unselected',
        'received',
        'not_received',
        'exempt',
      ] as const
    ),
    deliveryDays: optionalNonNegativeInteger(
      requested,
      'deliveryDays',
      current.deliveryDays
    ),
    documentUid: optionalIdentifier(
      requested,
      'documentUid',
      current.documentUid
    ),
  };
}


function sanitizeBrokerageContribution(
  parent: UnknownRecord,
  fieldName: string,
  current: TexasBrokerageContributionTermsDocument
): TexasBrokerageContributionTermsDocument {
  const requested = section(parent, fieldName);

  return {
    contributionType: enumValue(
      requested,
      'contributionType',
      current.contributionType,
      ['unselected', 'none', 'amount', 'percentage'] as const
    ),
    amountInCents: optionalNonNegativeInteger(
      requested,
      'amountInCents',
      current.amountInCents
    ),
    percentageOfSalesPrice: optionalNumber(
      requested,
      'percentageOfSalesPrice',
      current.percentageOfSalesPrice,
      0,
      100
    ),
  };
}


function sanitizeSpecialProvisions(
  requested: UnknownRecord,
  current: TexasSharedContractSectionsDocument['specialProvisions'],
  initiatedBy: 'buyer' | 'seller'
): TexasSharedContractSectionsDocument['specialProvisions'] {
  const requestedPreparedBy = optionalEnumValue(
    requested,
    'preparedBy',
    current.preparedBy,
    ['buyer', 'seller', 'attorney'] as const
  );

  const allowedPreparedBy:
    TexasSpecialProvisionsPreparedByDocument |
    undefined =
      requestedPreparedBy === 'attorney' ||
      requestedPreparedBy === initiatedBy
        ? requestedPreparedBy
        : current.preparedBy;

  return {
    included: booleanValue(
      requested,
      'included',
      current.included
    ),
    preparedBy: allowedPreparedBy,
    partyProvidedText: optionalText(
      requested,
      'partyProvidedText',
      current.partyProvidedText,
      10000
    ),
  };
}


function sanitizeNoticeContact(
  parent: UnknownRecord,
  fieldName: string,
  current: TexasNoticeContactDocument
): TexasNoticeContactDocument {
  const requested = section(parent, fieldName);

  return {
    addressLine1: optionalText(requested, 'addressLine1', current.addressLine1, 300),
    addressLine2: optionalText(requested, 'addressLine2', current.addressLine2, 300),
    city: optionalText(requested, 'city', current.city, 200),
    state: optionalText(requested, 'state', current.state, 100),
    zipCode: optionalText(requested, 'zipCode', current.zipCode, 20),
    phone: optionalText(requested, 'phone', current.phone, 50),
    email: optionalText(requested, 'email', current.email, 320),
  };
}


function sanitizeOptionalNoticeContact(
  parent: UnknownRecord,
  fieldName: string,
  current: TexasNoticeContactDocument | undefined
): TexasNoticeContactDocument | undefined {
  if (owns(parent, fieldName) && parent[fieldName] === null) {
    return undefined;
  }

  if (!owns(parent, fieldName) && !current) {
    return undefined;
  }

  return sanitizeNoticeContact(
    parent,
    fieldName,
    current ?? {}
  );
}


function sanitizeOptionalAttorneyContact(
  parent: UnknownRecord,
  fieldName: string,
  current: TexasAttorneyContactDocument | undefined
): TexasAttorneyContactDocument | undefined {
  if (owns(parent, fieldName) && parent[fieldName] === null) {
    return undefined;
  }

  if (!owns(parent, fieldName) && !current) {
    return undefined;
  }

  const requested = section(parent, fieldName);
  const fallback = current ?? {};

  return {
    name: optionalText(requested, 'name', fallback.name, 300),
    phone: optionalText(requested, 'phone', fallback.phone, 50),
    fax: optionalText(requested, 'fax', fallback.fax, 50),
    email: optionalText(requested, 'email', fallback.email, 320),
  };
}


function sanitizeApprovedAddenda(
  requestedTerms: UnknownRecord,
  currentAddenda: TexasAddendumSelectionDocument[]
): TexasAddendumSelectionDocument[] {
  const requestedValue = requestedTerms['addenda'];

  if (!Array.isArray(requestedValue)) {
    return currentAddenda.map(addendum => ({ ...addendum }));
  }

  const requestedRecords = requestedValue
    .filter(
      value =>
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
    ) as UnknownRecord[];

  return currentAddenda.map(current => {
    const requested = requestedRecords.find(
      candidate => candidate['formId'] === current.formId
    );

    if (!requested) {
      return { ...current };
    }

    return {
      formId: current.formId,
      title: current.title,
      included: booleanValue(
        requested,
        'included',
        current.included
      ),
      documentUid: optionalIdentifier(
        requested,
        'documentUid',
        current.documentUid
      ),
    };
  });
}
