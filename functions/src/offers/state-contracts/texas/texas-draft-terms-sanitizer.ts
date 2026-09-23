import type {
  TexasAddendumSelectionDocument,
  TexasAttorneyContactDocument,
  TexasBrokerageContributionTermsDocument,
  TexasDisclosureDeliveryTermsDocument,
  TexasNoticeContactDocument,
  TexasOneToFourFamilyResaleOfferTermsDocument,
  TexasSpecialProvisionsPreparedByDocument,
} from './texas-offer-terms.document';


type UnknownRecord =
  Record<string, unknown>;


export interface SanitizeTexasDraftTermsInput {
  requestedTerms: unknown;

  currentTerms:
    TexasOneToFourFamilyResaleOfferTermsDocument;

  initiatedBy:
    | 'buyer'
    | 'seller';
}


/*
 * Accepts only editable TREC 20-19 draft fields.
 *
 * State, contract type, form version, property snapshot,
 * timezone, and the approved addenda catalog are protected
 * server values and cannot be replaced by the browser.
 */
export function sanitizeTexasDraftTerms(
  input: SanitizeTexasDraftTermsInput
): TexasOneToFourFamilyResaleOfferTermsDocument {
  const requested =
    asRecord(input.requestedTerms);

  const current = input.currentTerms;

  const propertyIdentification =
    section(
      requested,
      'propertyIdentification'
    );

  const propertyTerms =
    section(requested, 'propertyTerms');

  const salesPrice =
    section(requested, 'salesPrice');

  const leases =
    section(requested, 'leases');

  const earnestMoneyAndOption =
    section(
      requested,
      'earnestMoneyAndOption'
    );

  const titlePolicy =
    section(requested, 'titlePolicy');

  const survey =
    section(requested, 'survey');

  const propertyAssociation =
    section(
      requested,
      'propertyAssociation'
    );

  const disclosures =
    section(requested, 'disclosures');

  const propertyCondition =
    section(requested, 'propertyCondition');

  const closingAndPossession =
    section(
      requested,
      'closingAndPossession'
    );

  const expenses =
    section(requested, 'expenses');

  const specialProvisions =
    section(requested, 'specialProvisions');

  const notices =
    section(requested, 'notices');

  const attorneys =
    section(requested, 'attorneys');

  const delivery =
    section(requested, 'delivery');

  return {
    stateCode: current.stateCode,
    contractType: current.contractType,

    form: {
      ...current.form,
    },

    property: {
      ...current.property,
    },

    propertyIdentification: {
      lot: optionalText(
        propertyIdentification,
        'lot',
        current.propertyIdentification.lot,
        200
      ),
      block: optionalText(
        propertyIdentification,
        'block',
        current.propertyIdentification.block,
        200
      ),
      addition: optionalText(
        propertyIdentification,
        'addition',
        current.propertyIdentification.addition,
        500
      ),
      legalDescriptionExhibitDocumentUid:
        optionalIdentifier(
          propertyIdentification,
          'legalDescriptionExhibitDocumentUid',
          current.propertyIdentification
            .legalDescriptionExhibitDocumentUid
        ),
    },

    propertyTerms: {
      exclusions: optionalText(
        propertyTerms,
        'exclusions',
        current.propertyTerms.exclusions,
        5000
      ),
      mineralWaterTimberReservationApplies:
        nullableBoolean(
          propertyTerms,
          'mineralWaterTimberReservationApplies',
          current.propertyTerms
            .mineralWaterTimberReservationApplies
        ),
      reservationAddendumDocumentUid:
        optionalIdentifier(
          propertyTerms,
          'reservationAddendumDocumentUid',
          current.propertyTerms
            .reservationAddendumDocumentUid
        ),
    },

    salesPrice: {
      cashPortionInCents:
        nonNegativeInteger(
          salesPrice,
          'cashPortionInCents',
          current.salesPrice
            .cashPortionInCents
        ),
      financingInCents:
        nonNegativeInteger(
          salesPrice,
          'financingInCents',
          current.salesPrice.financingInCents
        ),
      salesPriceInCents:
        nonNegativeInteger(
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

    leases: {
      residentialLeasesExist:
        current.leases.residentialLeasesExist,
      residentialLeasesReceived:
        nullableBoolean(
          leases,
          'residentialLeasesReceived',
          current.leases
            .residentialLeasesReceived
        ),
      residentialLeasesAddendumDocumentUid:
        optionalIdentifier(
          leases,
          'residentialLeasesAddendumDocumentUid',
          current.leases
            .residentialLeasesAddendumDocumentUid
        ),
      fixtureLeasesExist:
        current.leases.fixtureLeasesExist,
      fixtureLeasesReceived: nullableBoolean(
        leases,
        'fixtureLeasesReceived',
        current.leases.fixtureLeasesReceived
      ),
      fixtureLeasesAddendumDocumentUid:
        optionalIdentifier(
          leases,
          'fixtureLeasesAddendumDocumentUid',
          current.leases
            .fixtureLeasesAddendumDocumentUid
        ),
      naturalResourceLeasesExist:
        current.leases.naturalResourceLeasesExist,
      naturalResourceLeaseStatus: enumValue(
        leases,
        'naturalResourceLeaseStatus',
        current.leases
          .naturalResourceLeaseStatus,
        [
          'unselected',
          'none',
          'delivered',
          'not_delivered',
        ] as const
      ),
      naturalResourceLeaseDeliveryDays:
        optionalNonNegativeInteger(
          leases,
          'naturalResourceLeaseDeliveryDays',
          current.leases
            .naturalResourceLeaseDeliveryDays
        ),
      naturalResourceLeaseTerminationDays:
        optionalNonNegativeInteger(
          leases,
          'naturalResourceLeaseTerminationDays',
          current.leases
            .naturalResourceLeaseTerminationDays
        ),
    },

    earnestMoneyAndOption: {
      escrowAgentName: text(
        earnestMoneyAndOption,
        'escrowAgentName',
        current.earnestMoneyAndOption
          .escrowAgentName,
        300
      ),
      escrowAgentAddress: text(
        earnestMoneyAndOption,
        'escrowAgentAddress',
        current.earnestMoneyAndOption
          .escrowAgentAddress,
        500
      ),
      earnestMoneyInCents:
        nonNegativeInteger(
          earnestMoneyAndOption,
          'earnestMoneyInCents',
          current.earnestMoneyAndOption
            .earnestMoneyInCents
        ),
      optionFeeInCents: nonNegativeInteger(
        earnestMoneyAndOption,
        'optionFeeInCents',
        current.earnestMoneyAndOption
          .optionFeeInCents
      ),
      additionalEarnestMoneyInCents:
        optionalNonNegativeInteger(
          earnestMoneyAndOption,
          'additionalEarnestMoneyInCents',
          current.earnestMoneyAndOption
            .additionalEarnestMoneyInCents
        ),
      additionalEarnestMoneyDeliveryDays:
        optionalNonNegativeInteger(
          earnestMoneyAndOption,
          'additionalEarnestMoneyDeliveryDays',
          current.earnestMoneyAndOption
            .additionalEarnestMoneyDeliveryDays
        ),
      optionPeriodDays:
        optionalNonNegativeInteger(
          earnestMoneyAndOption,
          'optionPeriodDays',
          current.earnestMoneyAndOption
            .optionPeriodDays
        ),
    },

    titlePolicy: {
      titleCompanyName: text(
        titlePolicy,
        'titleCompanyName',
        current.titlePolicy.titleCompanyName,
        300
      ),
      titlePolicyExpensePayer: enumValue(
        titlePolicy,
        'titlePolicyExpensePayer',
        current.titlePolicy
          .titlePolicyExpensePayer,
        [
          'unselected',
          'buyer',
          'seller',
        ] as const
      ),
      boundaryExceptionTreatment: enumValue(
        titlePolicy,
        'boundaryExceptionTreatment',
        current.titlePolicy
          .boundaryExceptionTreatment,
        [
          'unselected',
          'not_amended_or_deleted',
          'amended_to_shortages_in_area',
        ] as const
      ),
      boundaryAmendmentExpensePayer:
        optionalEnumValue(
          titlePolicy,
          'boundaryAmendmentExpensePayer',
          current.titlePolicy
            .boundaryAmendmentExpensePayer,
          [
            'unselected',
            'buyer',
            'seller',
          ] as const
        ),
    },

    survey: {
      selection: enumValue(
        survey,
        'selection',
        current.survey.selection,
        [
          'unselected',
          'seller_existing_survey',
          'buyer_new_survey',
          'seller_new_survey',
        ] as const
      ),
      deliveryDays: nonNegativeInteger(
        survey,
        'deliveryDays',
        current.survey.deliveryDays
      ),
      newSurveyIfExistingRejectedExpensePayer:
        optionalEnumValue(
          survey,
          'newSurveyIfExistingRejectedExpensePayer',
          current.survey
            .newSurveyIfExistingRejectedExpensePayer,
          [
            'unselected',
            'buyer',
            'seller',
          ] as const
        ),
      prohibitedUseOrActivity: optionalText(
        survey,
        'prohibitedUseOrActivity',
        current.survey
          .prohibitedUseOrActivity,
        5000
      ),
      titleObjectionDays: nonNegativeInteger(
        survey,
        'titleObjectionDays',
        current.survey.titleObjectionDays
      ),
    },

    propertyAssociation: {
      mandatoryMembership: nullableBoolean(
        propertyAssociation,
        'mandatoryMembership',
          current.propertyAssociation
            .mandatoryMembership
      ),
      associationName:
        current.propertyAssociation.associationName,
      duesInCents:
        current.propertyAssociation.duesInCents,
      duesFrequency:
        current.propertyAssociation.duesFrequency,
      associationContact:
        current.propertyAssociation.associationContact,
      associationAddendumDocumentUid:
        optionalIdentifier(
          propertyAssociation,
          'associationAddendumDocumentUid',
          current.propertyAssociation
            .associationAddendumDocumentUid
        ),
    },

    disclosures: {
      propertyCondition: sanitizeDisclosure(
        disclosures,
        'propertyCondition',
        current.disclosures.propertyCondition
      ),
      waterRights: sanitizeDisclosure(
        disclosures,
        'waterRights',
        current.disclosures.waterRights
      ),
      waterRightsExemptionConfirmed:
        optionalBoolean(
          disclosures,
          'waterRightsExemptionConfirmed',
          current.disclosures
            .waterRightsExemptionConfirmed
        ),
      exemptWaterSupplierName: optionalText(
        disclosures,
        'exemptWaterSupplierName',
        current.disclosures
          .exemptWaterSupplierName,
        500
      ),
      leadBasedPaintApplies:
        nullableBoolean(
          disclosures,
          'leadBasedPaintApplies',
          current.disclosures
            .leadBasedPaintApplies
        ),
      leadBasedPaintAddendumDocumentUid:
        optionalIdentifier(
          disclosures,
          'leadBasedPaintAddendumDocumentUid',
          current.disclosures
            .leadBasedPaintAddendumDocumentUid
        ),
    },

    propertyCondition: {
      acceptance: enumValue(
        propertyCondition,
        'acceptance',
        current.propertyCondition.acceptance,
        [
          'unselected',
          'as_is',
          'as_is_with_specific_repairs',
        ] as const
      ),
      partyProvidedRepairsAndTreatments:
        optionalText(
          propertyCondition,
          'partyProvidedRepairsAndTreatments',
          current.propertyCondition
            .partyProvidedRepairsAndTreatments,
          10000
        ),
      residentialServiceContractReimbursementInCents:
        optionalNonNegativeInteger(
          propertyCondition,
          'residentialServiceContractReimbursementInCents',
          current.propertyCondition
            .residentialServiceContractReimbursementInCents
        ),
    },

    closingAndPossession: {
      closingDate: text(
        closingAndPossession,
        'closingDate',
        current.closingAndPossession
          .closingDate,
        10
      ),
      possession: enumValue(
        closingAndPossession,
        'possession',
        current.closingAndPossession.possession,
        [
          'unselected',
          'upon_closing_and_funding',
          'temporary_residential_lease',
        ] as const
      ),
      temporaryResidentialLeaseDocumentUid:
        optionalIdentifier(
          closingAndPossession,
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
          current.expenses
            .sellerContributionToBuyerExpensesType ?? 'unselected',
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
          current.expenses
            .sellerContributionToBuyerBroker
        ),
      buyerContributionToSellerBroker:
        sanitizeBrokerageContribution(
          expenses,
          'buyerContributionToSellerBroker',
          current.expenses
            .buyerContributionToSellerBroker
        ),
    },

    brokerOrSalesAgentDisclosure:
      optionalText(
        requested,
        'brokerOrSalesAgentDisclosure',
        current.brokerOrSalesAgentDisclosure,
        10000
      ),

    specialProvisions:
      sanitizeSpecialProvisions(
        specialProvisions,
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
      sellerAgent:
        sanitizeOptionalNoticeContact(
          notices,
          'sellerAgent',
          current.notices.sellerAgent
        ),
    },

    attorneys: {
      buyerAttorney:
        sanitizeOptionalAttorneyContact(
          attorneys,
          'buyerAttorney',
          current.attorneys.buyerAttorney
        ),
      sellerAttorney:
        sanitizeOptionalAttorneyContact(
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
      electronicDeliveryAuthorized:
        nullableBoolean(
          delivery,
          'electronicDeliveryAuthorized',
          current.delivery
            .electronicDeliveryAuthorized
        ),
    },
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
  current:
    TexasBrokerageContributionTermsDocument
): TexasBrokerageContributionTermsDocument {
  const requested = section(parent, fieldName);

  return {
    contributionType: enumValue(
      requested,
      'contributionType',
      current.contributionType,
      [
        'unselected',
        'none',
        'amount',
        'percentage',
      ] as const
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
  current:
    TexasOneToFourFamilyResaleOfferTermsDocument[
      'specialProvisions'
    ],
  initiatedBy: 'buyer' | 'seller'
): TexasOneToFourFamilyResaleOfferTermsDocument[
  'specialProvisions'
] {
  const included = booleanValue(
    requested,
    'included',
    current.included
  );

  const requestedPreparedBy = optionalEnumValue(
    requested,
    'preparedBy',
    current.preparedBy,
    [
      'buyer',
      'seller',
      'attorney',
    ] as const
  );

  const allowedPreparedBy:
    TexasSpecialProvisionsPreparedByDocument |
    undefined =
      requestedPreparedBy === 'attorney' ||
      requestedPreparedBy === initiatedBy
        ? requestedPreparedBy
        : current.preparedBy;

  return {
    included,
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
    addressLine1: optionalText(
      requested,
      'addressLine1',
      current.addressLine1,
      300
    ),
    addressLine2: optionalText(
      requested,
      'addressLine2',
      current.addressLine2,
      300
    ),
    city: optionalText(
      requested,
      'city',
      current.city,
      200
    ),
    state: optionalText(
      requested,
      'state',
      current.state,
      100
    ),
    zipCode: optionalText(
      requested,
      'zipCode',
      current.zipCode,
      20
    ),
    phone: optionalText(
      requested,
      'phone',
      current.phone,
      50
    ),
    email: optionalText(
      requested,
      'email',
      current.email,
      320
    ),
  };
}


function sanitizeOptionalNoticeContact(
  parent: UnknownRecord,
  fieldName: string,
  current: TexasNoticeContactDocument | undefined
): TexasNoticeContactDocument | undefined {
  if (
    owns(parent, fieldName) &&
    parent[fieldName] === null
  ) {
    return undefined;
  }

  if (
    !owns(parent, fieldName) &&
    !current
  ) {
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
  current:
    TexasAttorneyContactDocument |
    undefined
): TexasAttorneyContactDocument | undefined {
  if (
    owns(parent, fieldName) &&
    parent[fieldName] === null
  ) {
    return undefined;
  }

  if (
    !owns(parent, fieldName) &&
    !current
  ) {
    return undefined;
  }

  const requested = section(parent, fieldName);
  const fallback = current ?? {};

  return {
    name: optionalText(
      requested,
      'name',
      fallback.name,
      300
    ),
    phone: optionalText(
      requested,
      'phone',
      fallback.phone,
      50
    ),
    fax: optionalText(
      requested,
      'fax',
      fallback.fax,
      50
    ),
    email: optionalText(
      requested,
      'email',
      fallback.email,
      320
    ),
  };
}


function sanitizeApprovedAddenda(
  requestedTerms: UnknownRecord,
  currentAddenda:
    TexasAddendumSelectionDocument[]
): TexasAddendumSelectionDocument[] {
  const requestedValue =
    requestedTerms['addenda'];

  if (!Array.isArray(requestedValue)) {
    return currentAddenda.map(
      addendum => ({ ...addendum })
    );
  }

  const requestedRecords =
    requestedValue
      .map(value => asRecord(value))
      .filter(
        value => Object.keys(value).length > 0
      );

  return currentAddenda.map(current => {
    const requested =
      requestedRecords.find(
        candidate =>
          candidate['formId'] ===
          current.formId
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


function asRecord(value: unknown): UnknownRecord {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
    ? value as UnknownRecord
    : {};
}


function section(
  parent: UnknownRecord,
  fieldName: string
): UnknownRecord {
  return asRecord(parent[fieldName]);
}


function owns(
  data: UnknownRecord,
  fieldName: string
): boolean {
  return Object.prototype.hasOwnProperty.call(
    data,
    fieldName
  );
}


function text(
  data: UnknownRecord,
  fieldName: string,
  current: string,
  maximumLength: number
): string {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (typeof value !== 'string') {
    return current;
  }

  return value
    .trim()
    .slice(0, maximumLength);
}


function optionalText(
  data: UnknownRecord,
  fieldName: string,
  current: string | undefined,
  maximumLength: number
): string | undefined {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (value === null || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    return current;
  }

  const normalized =
    value.trim().slice(0, maximumLength);

  return normalized.length > 0
    ? normalized
    : undefined;
}


function optionalIdentifier(
  data: UnknownRecord,
  fieldName: string,
  current: string | undefined
): string | undefined {
  const value = optionalText(
    data,
    fieldName,
    current,
    200
  );

  return value && !value.includes('/')
    ? value
    : value === undefined
      ? undefined
      : current;
}


function booleanValue(
  data: UnknownRecord,
  fieldName: string,
  current: boolean
): boolean {
  if (!owns(data, fieldName)) {
    return current;
  }

  return typeof data[fieldName] === 'boolean'
    ? data[fieldName] as boolean
    : current;
}


function optionalBoolean(
  data: UnknownRecord,
  fieldName: string,
  current: boolean | undefined
): boolean | undefined {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (value === null) {
    return undefined;
  }

  return typeof value === 'boolean'
    ? value
    : current;
}


function nullableBoolean(
  data: UnknownRecord,
  fieldName: string,
  current: boolean | null
): boolean | null {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  return (
    typeof value === 'boolean' ||
    value === null
  )
    ? value
    : current;
}


function nonNegativeInteger(
  data: UnknownRecord,
  fieldName: string,
  current: number
): number {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
  )
    ? value
    : current;
}


function optionalNonNegativeInteger(
  data: UnknownRecord,
  fieldName: string,
  current: number | undefined
): number | undefined {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (value === null) {
    return undefined;
  }

  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0
  )
    ? value
    : current;
}


function optionalNumber(
  data: UnknownRecord,
  fieldName: string,
  current: number | undefined,
  minimum: number,
  maximum: number
): number | undefined {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (value === null) {
    return undefined;
  }

  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  )
    ? value
    : current;
}


function enumValue<
  TValue extends string
>(
  data: UnknownRecord,
  fieldName: string,
  current: TValue,
  allowedValues: readonly TValue[]
): TValue {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  return (
    typeof value === 'string' &&
    allowedValues.includes(value as TValue)
  )
    ? value as TValue
    : current;
}


function optionalEnumValue<
  TValue extends string
>(
  data: UnknownRecord,
  fieldName: string,
  current: TValue | undefined,
  allowedValues: readonly TValue[]
): TValue | undefined {
  if (!owns(data, fieldName)) {
    return current;
  }

  const value = data[fieldName];

  if (value === null) {
    return undefined;
  }

  return (
    typeof value === 'string' &&
    allowedValues.includes(value as TValue)
  )
    ? value as TValue
    : current;
}


function enumArray<
  TValue extends string
>(
  data: UnknownRecord,
  fieldName: string,
  current: TValue[],
  allowedValues: readonly TValue[]
): TValue[] {
  if (!owns(data, fieldName)) {
    return [...current];
  }

  const value = data[fieldName];

  if (!Array.isArray(value)) {
    return [...current];
  }

  return Array.from(
    new Set(
      value.filter(
        candidate =>
          typeof candidate === 'string' &&
          allowedValues.includes(
            candidate as TValue
          )
      ) as TValue[]
    )
  );
}
