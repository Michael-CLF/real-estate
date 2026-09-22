import type {
  OfferQuestionDefinition,
  OfferQuestionOption,
} from '../../../engine/models/offer-question-definition';

import type {
  OfferSectionDefinition,
} from '../../../engine/models/offer-section-definition';


const REQUIRED = {
  required: true,
} as const;


const POSITIVE_DAYS = {
  required: true,
  minimum: 1,
} as const;


const DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;


const MAXIMUM_DOCUMENT_SIZE =
  20 * 1_048_576;


const PARTY_OPTIONS:
  readonly OfferQuestionOption[] = [
    {
      value: 'buyer',
      label: 'Buyer',
    },
    {
      value: 'seller',
      label: 'Seller',
    },
  ];


const DELIVERY_STATUS_OPTIONS:
  readonly OfferQuestionOption[] = [
    {
      value: 'received',
      label: 'Received',
    },
    {
      value: 'not_received',
      label: 'Not received',
    },
    {
      value: 'exempt',
      label: 'Exempt',
    },
  ];


export const TEXAS_PROPERTY_IDENTIFICATION_SECTION:
  OfferSectionDefinition = {
    id: 'property-identification',
    title: 'Property identification',
    shortTitle: 'Property',
    description:
      'Confirm the legal property identification used by the selected Texas contract.',
    questions: [
      textQuestion(
        'property-lot',
        'propertyIdentification.lot',
        'Lot'
      ),
      textQuestion(
        'property-block',
        'propertyIdentification.block',
        'Block'
      ),
      textQuestion(
        'property-addition',
        'propertyIdentification.addition',
        'Addition or subdivision'
      ),
      documentQuestion(
        'property-legal-description-exhibit',
        'propertyIdentification.legalDescriptionExhibitDocumentUid',
        'Legal-description exhibit',
        'Attach an exhibit when the listing snapshot does not contain the complete legal description.'
      ),
    ],
  };


export const TEXAS_PROPERTY_TERMS_SECTION:
  OfferSectionDefinition = {
    id: 'property-terms',
    title: 'Property terms',
    shortTitle: 'Terms',
    questions: [
      textAreaQuestion(
        'property-exclusions',
        'propertyTerms.exclusions',
        'Property exclusions'
      ),
      yesNoQuestion(
        'property-reservation-applies',
        'propertyTerms.mineralWaterTimberReservationApplies',
        'Does a mineral, water or timber reservation apply?'
      ),
      documentQuestion(
        'property-reservation-document',
        'propertyTerms.reservationAddendumDocumentUid',
        'Reservation addendum',
        undefined,
        visibleWhenTrue(
          'propertyTerms.mineralWaterTimberReservationApplies'
        ),
        true
      ),
    ],
  };


export const TEXAS_LEASES_SECTION:
  OfferSectionDefinition = {
    id: 'leases',
    title: 'Leases',
    questions: [
      yesNoQuestion(
        'residential-leases-exist',
        'leases.residentialLeasesExist',
        'Are there any residential leases?'
      ),
      documentQuestion(
        'residential-leases-document',
        'leases.residentialLeasesAddendumDocumentUid',
        'Residential-leases addendum',
        undefined,
        visibleWhenTrue('leases.residentialLeasesExist'),
        true
      ),
      yesNoQuestion(
        'fixture-leases-exist',
        'leases.fixtureLeasesExist',
        'Are there any fixture leases?'
      ),
      documentQuestion(
        'fixture-leases-document',
        'leases.fixtureLeasesAddendumDocumentUid',
        'Fixture-leases addendum',
        undefined,
        visibleWhenTrue('leases.fixtureLeasesExist'),
        true
      ),
      choiceQuestion(
        'natural-resource-lease-status',
        'leases.naturalResourceLeaseStatus',
        'Natural-resource lease status',
        [
          {
            value: 'none',
            label: 'No natural-resource leases',
          },
          {
            value: 'delivered',
            label: 'Lease information delivered',
          },
          {
            value: 'not_delivered',
            label: 'Lease information not yet delivered',
          },
        ]
      ),
      numberQuestion(
        'natural-resource-delivery-days',
        'leases.naturalResourceLeaseDeliveryDays',
        'Delivery period in days',
        POSITIVE_DAYS,
        visibleWhenEquals(
          'leases.naturalResourceLeaseStatus',
          'not_delivered'
        )
      ),
      numberQuestion(
        'natural-resource-termination-days',
        'leases.naturalResourceLeaseTerminationDays',
        'Buyer termination period in days',
        POSITIVE_DAYS,
        visibleWhenEquals(
          'leases.naturalResourceLeaseStatus',
          'not_delivered'
        )
      ),
    ],
  };


export const TEXAS_SURVEY_SECTION:
  OfferSectionDefinition = {
    id: 'survey',
    title: 'Survey and title objections',
    shortTitle: 'Survey',
    questions: [
      choiceQuestion(
        'survey-selection',
        'survey.selection',
        'Survey option',
        [
          {
            value: 'seller_existing_survey',
            label: 'Seller provides an existing survey',
          },
          {
            value: 'buyer_new_survey',
            label: 'Buyer obtains a new survey',
          },
          {
            value: 'seller_new_survey',
            label: 'Seller obtains a new survey',
          },
        ]
      ),
      numberQuestion(
        'survey-delivery-days',
        'survey.deliveryDays',
        'Survey delivery period in days',
        POSITIVE_DAYS
      ),
      choiceQuestion(
        'replacement-survey-payer',
        'survey.newSurveyIfExistingRejectedExpensePayer',
        'Who pays for a replacement survey if the existing survey is unacceptable?',
        PARTY_OPTIONS,
        visibleWhenEquals(
          'survey.selection',
          'seller_existing_survey'
        )
      ),
      textQuestion(
        'survey-prohibited-use',
        'survey.prohibitedUseOrActivity',
        'Prohibited use or activity identified by the buyer'
      ),
      numberQuestion(
        'title-objection-days',
        'survey.titleObjectionDays',
        'Title-objection period in days',
        POSITIVE_DAYS
      ),
    ],
  };


export const TEXAS_ASSOCIATION_SECTION:
  OfferSectionDefinition = {
    id: 'property-association',
    title: 'Property owners association',
    shortTitle: 'Association',
    questions: [
      yesNoQuestion(
        'mandatory-association-membership',
        'propertyAssociation.mandatoryMembership',
        'Is membership in a property owners association mandatory?'
      ),
    ],
  };


export const TEXAS_DISCLOSURES_SECTION:
  OfferSectionDefinition = {
    id: 'disclosures',
    title: 'Seller disclosures',
    shortTitle: 'Disclosures',
    questions: [
      choiceQuestion(
        'property-condition-disclosure-status',
        'disclosures.propertyCondition.status',
        'Seller property-condition disclosure',
        DELIVERY_STATUS_OPTIONS
      ),
      numberQuestion(
        'property-condition-disclosure-days',
        'disclosures.propertyCondition.deliveryDays',
        'Delivery period in days',
        POSITIVE_DAYS,
        visibleWhenEquals(
          'disclosures.propertyCondition.status',
          'not_received'
        )
      ),
      choiceQuestion(
        'water-rights-disclosure-status',
        'disclosures.waterRights.status',
        'Water and mineral-rights disclosure',
        DELIVERY_STATUS_OPTIONS
      ),
      numberQuestion(
        'water-rights-disclosure-days',
        'disclosures.waterRights.deliveryDays',
        'Delivery period in days',
        POSITIVE_DAYS,
        visibleWhenEquals(
          'disclosures.waterRights.status',
          'not_received'
        )
      ),
      yesNoQuestion(
        'lead-paint-applies',
        'disclosures.leadBasedPaintApplies',
        'Does the lead-based-paint addendum apply?'
      ),
      {
        id: 'seller-disclosure-source-note',
        type: 'information',
        label: 'Seller-provided documents',
        description:
          'Disclosure documents are supplied by the seller with the listing. Select whether you received each disclosure; do not upload the seller’s documents again.',
      },
    ],
  };


export function createTexasConstructionSection(
  incompleteConstruction: boolean
): OfferSectionDefinition {
  return {
    id: 'construction',
    title: 'Construction documents',
    shortTitle: 'Construction',
    questions: [
      choiceQuestion(
        'plans-status',
        'construction.plansAndSpecificationsStatus',
        'Plans and specifications status',
        [
          {
            value: 'received',
            label: 'Received',
          },
          {
            value: 'not_received',
            label: 'Not received',
          },
        ]
      ),
      documentQuestion(
        'plans-document',
        'construction.plansAndSpecificationsDocumentUid',
        'Plans and specifications',
        undefined,
        visibleWhenEquals(
          'construction.plansAndSpecificationsStatus',
          'received'
        ),
        true
      ),
      numberQuestion(
        'construction-documents-days',
        'construction.constructionDocumentsDeliveryDays',
        'Construction-document delivery period in days',
        POSITIVE_DAYS,
        visibleWhenEquals(
          'construction.plansAndSpecificationsStatus',
          'not_received'
        )
      ),
      choiceQuestion(
        'buyer-selection-status',
        'construction.buyerSelectionDocumentsStatus',
        'Buyer-selection documents status',
        [
          {
            value: 'received',
            label: 'Received',
          },
          {
            value: 'not_received',
            label: 'Not received',
          },
        ]
      ),
      documentQuestion(
        'buyer-selection-document',
        'construction.buyerSelectionDocumentsUid',
        'Buyer-selection documents',
        undefined,
        visibleWhenEquals(
          'construction.buyerSelectionDocumentsStatus',
          'received'
        ),
        true
      ),
      numberQuestion(
        'buyer-selection-deadline',
        'construction.buyerSelectionDeadlineDays',
        'Buyer-selection deadline in days',
        POSITIVE_DAYS,
        visibleWhenEquals(
          'construction.buyerSelectionDocumentsStatus',
          'not_received'
        )
      ),
      ...(
        incompleteConstruction
          ? [
            dateQuestion(
              'anticipated-completion-date',
              'construction.anticipatedCompletionDate',
              'Anticipated completion date'
            ),
          ]
          : []
      ),
      yesNoQuestion(
        'certificate-of-occupancy-required',
        'construction.certificateOfOccupancyRequired',
        'Is a certificate of occupancy required?'
      ),
      documentQuestion(
        'builder-warranty',
        'construction.builderWarrantyDocumentUid',
        'Builder warranty'
      ),
      documentQuestion(
        'third-party-warranty',
        'construction.thirdPartyWarrantyDocumentUid',
        'Third-party warranty'
      ),
    ],
  };
}


const TEXAS_ADDENDUM_OPTIONS:
  readonly OfferQuestionOption[] = [
    option('third-party-financing', 'Third Party Financing Addendum'),
    option('sale-of-other-property', 'Sale of Other Property by Buyer Addendum'),
    option('lender-appraisal-termination', 'Lender Appraisal Termination Addendum'),
    option('seller-financing', 'Seller Financing Addendum'),
    option('section-1031-exchange', 'Section 1031 Exchange Addendum'),
    option('short-sale', 'Short Sale Addendum'),
    option('loan-assumption', 'Loan Assumption Addendum'),
    option('assumed-loan-release-va-restoration', 'Assumed Loan Release or VA Restoration Addendum'),
    option('residential-leases', 'Residential Leases Addendum'),
    option('fixture-leases', 'Fixture Leases Addendum'),
    option('buyer-temporary-residential-lease', 'Buyer Temporary Residential Lease'),
    option('seller-temporary-residential-lease', 'Seller Temporary Residential Lease'),
    option('hydrostatic-testing', 'Hydrostatic Testing Addendum'),
    option('environmental-assessment', 'Environmental Assessment Addendum'),
    option('lead-based-paint', 'Lead-Based Paint Addendum'),
    option('propane-gas-service-area', 'Propane Gas Service Area Addendum'),
    option('seaward-gulf-intracoastal-waterway', 'Gulf Intracoastal Waterway Addendum'),
    option('coastal-area-property', 'Coastal Area Property Addendum'),
    option('district-notices', 'District Notices'),
    option('mandatory-poa-membership', 'Mandatory POA Membership Addendum'),
    option('non-realty-items', 'Non-Realty Items Addendum'),
    option('back-up-contract', 'Back-Up Contract Addendum'),
    option('mineral-reservation', 'Mineral Reservation Addendum'),
    option('other', 'Other Addendum'),
  ];


export const TEXAS_SHARED_TRANSACTION_SECTIONS:
  readonly OfferSectionDefinition[] = [
    {
      id: 'price-financing',
      title: 'Price and financing',
      shortTitle: 'Price',
      questions: [
        currencyQuestion(
          'cash-portion',
          'salesPrice.cashPortionInCents',
          'Cash portion'
        ),
        currencyQuestion(
          'financing-portion',
          'salesPrice.financingInCents',
          'Financing portion'
        ),
        currencyQuestion(
          'total-sales-price',
          'salesPrice.salesPriceInCents',
          'Total sales price'
        ),
        multipleChoiceQuestion(
          'financing-addenda',
          'salesPrice.financingAddenda',
          'Applicable financing addenda',
          [
            {
              value: 'third_party_financing',
              label: 'Third-party financing',
            },
            {
              value: 'loan_assumption',
              label: 'Loan assumption',
            },
            {
              value: 'seller_financing',
              label: 'Seller financing',
            },
          ]
        ),
      ],
    },
    {
      id: 'earnest-money-option',
      title: 'Earnest money and option fee',
      shortTitle: 'Deposits',
      questions: [
        textQuestion(
          'escrow-agent-name',
          'earnestMoneyAndOption.escrowAgentName',
          'Escrow agent or title company (optional)'
        ),
        textQuestion(
          'escrow-agent-address',
          'earnestMoneyAndOption.escrowAgentAddress',
          'Escrow-agent address (optional)'
        ),
        currencyQuestion(
          'earnest-money',
          'earnestMoneyAndOption.earnestMoneyInCents',
          'Earnest money'
        ),
        currencyQuestion(
          'option-fee',
          'earnestMoneyAndOption.optionFeeInCents',
          'Option fee'
        ),
        numberQuestion(
          'option-period-days',
          'earnestMoneyAndOption.optionPeriodDays',
          'Option period in days',
          POSITIVE_DAYS,
          visibleWhenGreaterThanZero(
            'earnestMoneyAndOption.optionFeeInCents'
          )
        ),
        currencyQuestion(
          'additional-earnest-money',
          'earnestMoneyAndOption.additionalEarnestMoneyInCents',
          'Additional earnest money',
          undefined,
          false
        ),
        numberQuestion(
          'additional-earnest-delivery-days',
          'earnestMoneyAndOption.additionalEarnestMoneyDeliveryDays',
          'Additional earnest-money delivery period in days',
          POSITIVE_DAYS,
          visibleWhenGreaterThanZero(
            'earnestMoneyAndOption.additionalEarnestMoneyInCents'
          )
        ),
      ],
    },
    {
      id: 'title-policy',
      title: 'Title policy',
      shortTitle: 'Title',
      questions: [
        textQuestion(
          'title-company-name',
          'titlePolicy.titleCompanyName',
          'Title company (optional)'
        ),
        choiceQuestion(
          'title-policy-payer',
          'titlePolicy.titlePolicyExpensePayer',
          'Who pays for the owner title policy?',
          PARTY_OPTIONS
        ),
        choiceQuestion(
          'boundary-exception-treatment',
          'titlePolicy.boundaryExceptionTreatment',
          'Boundary-exception treatment',
          [
            {
              value: 'not_amended_or_deleted',
              label: 'Not amended or deleted',
            },
            {
              value: 'amended_to_shortages_in_area',
              label: 'Amended to shortages in area',
            },
          ]
        ),
        choiceQuestion(
          'boundary-amendment-payer',
          'titlePolicy.boundaryAmendmentExpensePayer',
          'Who pays for the boundary amendment?',
          PARTY_OPTIONS,
          visibleWhenEquals(
            'titlePolicy.boundaryExceptionTreatment',
            'amended_to_shortages_in_area'
          )
        ),
      ],
    },
    {
      id: 'condition-closing',
      title: 'Property condition, closing and possession',
      shortTitle: 'Closing',
      questions: [
        choiceQuestion(
          'property-condition-acceptance',
          'propertyCondition.acceptance',
          'Property-condition acceptance',
          [
            {
              value: 'as_is',
              label: 'As is',
            },
            {
              value: 'as_is_with_specific_repairs',
              label: 'As is with specific repairs or treatments',
            },
          ]
        ),
        textAreaQuestion(
          'specific-repairs',
          'propertyCondition.partyProvidedRepairsAndTreatments',
          'Party- or attorney-provided repairs and treatments',
          REQUIRED,
          visibleWhenEquals(
            'propertyCondition.acceptance',
            'as_is_with_specific_repairs'
          )
        ),
        currencyQuestion(
          'service-contract-reimbursement',
          'propertyCondition.residentialServiceContractReimbursementInCents',
          'Residential service-contract reimbursement',
          undefined,
          false
        ),
        dateQuestion(
          'closing-date',
          'closingAndPossession.closingDate',
          'Closing date'
        ),
        choiceQuestion(
          'possession',
          'closingAndPossession.possession',
          'Possession',
          [
            {
              value: 'upon_closing_and_funding',
              label: 'Upon closing and funding',
            },
            {
              value: 'temporary_residential_lease',
              label: 'Under a temporary residential lease',
            },
          ]
        ),
        documentQuestion(
          'temporary-residential-lease',
          'closingAndPossession.temporaryResidentialLeaseDocumentUid',
          'Temporary residential lease',
          undefined,
          visibleWhenEquals(
            'closingAndPossession.possession',
            'temporary_residential_lease'
          ),
          true
        ),
      ],
    },
    {
      id: 'expenses-contributions',
      title: 'Expenses and brokerage contributions',
      shortTitle: 'Expenses',
      questions: [
        currencyQuestion(
          'seller-buyer-expenses',
          'expenses.sellerContributionToBuyerExpensesInCents',
          'Seller contribution to buyer expenses',
          undefined,
          false
        ),
        ...brokerageContributionQuestions(
          'seller-to-buyer-broker',
          'expenses.sellerContributionToBuyerBroker',
          'Seller contribution to buyer broker'
        ),
        ...brokerageContributionQuestions(
          'buyer-to-seller-broker',
          'expenses.buyerContributionToSellerBroker',
          'Buyer contribution to seller broker'
        ),
      ],
    },
    {
      id: 'special-provisions',
      title: 'Special provisions',
      questions: [
        textAreaQuestion(
          'broker-disclosure',
          'brokerOrSalesAgentDisclosure',
          'Broker or sales-agent disclosure'
        ),
        yesNoQuestion(
          'special-provisions-included',
          'specialProvisions.included',
          'Are special provisions included?'
        ),
        choiceQuestion(
          'special-provisions-prepared-by',
          'specialProvisions.preparedBy',
          'Who supplied the special provisions?',
          [
            ...PARTY_OPTIONS,
            {
              value: 'attorney',
              label: 'Attorney',
            },
          ],
          visibleWhenTrue('specialProvisions.included')
        ),
        textAreaQuestion(
          'special-provisions-text',
          'specialProvisions.partyProvidedText',
          'Party- or attorney-provided special provisions',
          REQUIRED,
          visibleWhenTrue('specialProvisions.included')
        ),
      ],
    },
    createTexasAddendaSection(),
    {
      id: 'delivery-certification',
      title: 'Delivery and certification',
      shortTitle: 'Certification',
      questions: [
        {
          id: 'offer-expiration',
          type: 'date_time',
          fieldPath: 'delivery.expiresAt',
          label: 'Offer expiration date and time',
          validation: REQUIRED,
        },
        {
          id: 'electronic-delivery-authorized',
          type: 'acknowledgement',
          fieldPath:
            'delivery.electronicDeliveryAuthorized',
          label:
            'I authorize electronic delivery of this offer and related documents.',
          validation: REQUIRED,
        },
        {
          id: 'legal-language-notice',
          type: 'information',
          label: 'Contract language',
          description:
            'NavStreet does not draft legal provisions. Special provisions and repair language must be supplied by a party or attorney.',
          tone: 'important',
        },
      ],
    },
  ];


function createTexasAddendaSection():
  OfferSectionDefinition {
  return {
    id: 'addenda',
    title: 'Addenda and supporting documents',
    shortTitle: 'Addenda',
    questions: [
      {
        id: 'selected-addenda',
        type: 'multiple_choice',
        fieldPath: 'addenda',
        label: 'Select every addendum included with this offer',
        options: TEXAS_ADDENDUM_OPTIONS,
        objectSelection: {
          valueKey: 'formId',
          selectedKey: 'included',
        },
      },
      ...TEXAS_ADDENDUM_OPTIONS.map(
        option =>
          documentQuestion(
            `addendum-${option.value}`,
            `addenda.${option.value}.documentUid`,
            option.label,
            'Attach the completed addendum.',
            visibleWhenTrue(
              `addenda.${option.value}.included`
            ),
            true
          )
      ),
    ],
  };
}


function brokerageContributionQuestions(
  idPrefix: string,
  fieldPrefix: string,
  label: string
): OfferQuestionDefinition[] {
  return [
    choiceQuestion(
      `${idPrefix}-type`,
      `${fieldPrefix}.contributionType`,
      label,
      [
        {
          value: 'none',
          label: 'None',
        },
        {
          value: 'amount',
          label: 'Dollar amount',
        },
        {
          value: 'percentage',
          label: 'Percentage of sales price',
        },
      ]
    ),
    currencyQuestion(
      `${idPrefix}-amount`,
      `${fieldPrefix}.amountInCents`,
      `${label} amount`,
      visibleWhenEquals(
        `${fieldPrefix}.contributionType`,
        'amount'
      )
    ),
    numberQuestion(
      `${idPrefix}-percentage`,
      `${fieldPrefix}.percentageOfSalesPrice`,
      `${label} percentage`,
      {
        required: true,
        minimum: 0.01,
        maximum: 100,
      },
      visibleWhenEquals(
        `${fieldPrefix}.contributionType`,
        'percentage'
      )
    ),
  ];
}


function textQuestion(
  id: string,
  fieldPath: string,
  label: string,
  validation = {},
  visibleWhen?: OfferQuestionDefinition['visibleWhen']
): OfferQuestionDefinition {
  return {
    id,
    type: 'text',
    fieldPath,
    label,
    validation,
    ...(visibleWhen ? { visibleWhen } : {}),
  };
}


function textAreaQuestion(
  id: string,
  fieldPath: string,
  label: string,
  validation = {},
  visibleWhen?: OfferQuestionDefinition['visibleWhen']
): OfferQuestionDefinition {
  return {
    id,
    type: 'textarea',
    fieldPath,
    label,
    validation,
    ...(visibleWhen ? { visibleWhen } : {}),
  };
}


function currencyQuestion(
  id: string,
  fieldPath: string,
  label: string,
  visibleWhen?: OfferQuestionDefinition['visibleWhen'],
  required = true
): OfferQuestionDefinition {
  return {
    id,
    type: 'currency',
    fieldPath,
    label,
    validation: {
      ...(required ? { required: true } : {}),
      minimum: 0,
    },
    ...(visibleWhen ? { visibleWhen } : {}),
  };
}


function numberQuestion(
  id: string,
  fieldPath: string,
  label: string,
  validation = {},
  visibleWhen?: OfferQuestionDefinition['visibleWhen']
): OfferQuestionDefinition {
  return {
    id,
    type: 'number',
    fieldPath,
    label,
    validation,
    ...(visibleWhen ? { visibleWhen } : {}),
  };
}


function dateQuestion(
  id: string,
  fieldPath: string,
  label: string
): OfferQuestionDefinition {
  return {
    id,
    type: 'date',
    fieldPath,
    label,
    validation: REQUIRED,
  };
}


function yesNoQuestion(
  id: string,
  fieldPath: string,
  label: string
): OfferQuestionDefinition {
  return {
    id,
    type: 'yes_no',
    fieldPath,
    label,
    validation: REQUIRED,
  };
}


function choiceQuestion(
  id: string,
  fieldPath: string,
  label: string,
  options: readonly OfferQuestionOption[],
  visibleWhen?: OfferQuestionDefinition['visibleWhen']
): OfferQuestionDefinition {
  return {
    id,
    type: 'single_choice',
    fieldPath,
    label,
    options,
    validation: REQUIRED,
    ...(visibleWhen ? { visibleWhen } : {}),
  };
}


function multipleChoiceQuestion(
  id: string,
  fieldPath: string,
  label: string,
  options: readonly OfferQuestionOption[]
): OfferQuestionDefinition {
  return {
    id,
    type: 'multiple_choice',
    fieldPath,
    label,
    options,
  };
}


function documentQuestion(
  id: string,
  fieldPath: string,
  label: string,
  description?: string,
  visibleWhen?: OfferQuestionDefinition['visibleWhen'],
  required = false
): OfferQuestionDefinition {
  return {
    id,
    type: 'document_upload',
    fieldPath,
    label,
    acceptedMimeTypes: DOCUMENT_TYPES,
    maximumFileSizeInBytes:
      MAXIMUM_DOCUMENT_SIZE,
    ...(
      required
        ? { validation: REQUIRED }
        : {}
    ),
    ...(description ? { description } : {}),
    ...(visibleWhen ? { visibleWhen } : {}),
  };
}


function visibleWhenTrue(
  fieldPath: string
): OfferQuestionDefinition['visibleWhen'] {
  return {
    match: 'all',
    conditions: [
      {
        fieldPath,
        operator: 'is_true',
      },
    ],
  };
}


function visibleWhenEquals(
  fieldPath: string,
  value: unknown
): OfferQuestionDefinition['visibleWhen'] {
  return {
    match: 'all',
    conditions: [
      {
        fieldPath,
        operator: 'equals',
        value,
      },
    ],
  };
}


function visibleWhenGreaterThanZero(
  fieldPath: string
): OfferQuestionDefinition['visibleWhen'] {
  return {
    match: 'all',
    conditions: [
      {
        fieldPath,
        operator: 'is_not_empty',
      },
      {
        fieldPath,
        operator: 'not_equals',
        value: 0,
      },
    ],
  };
}


function option(
  value: string,
  label: string
): OfferQuestionOption {
  return {
    value,
    label,
  };
}
