import type {
  OfferSectionDefinition,
} from '../../../../engine/models/offer-section-definition';

import {
  TEXAS_ASSOCIATION_SECTION,
  TEXAS_SHARED_TRANSACTION_SECTIONS,
  TEXAS_SURVEY_SECTION,
} from '../../questions/texas-shared-question-definitions';


export const TEXAS_UNIMPROVED_PROPERTY_SECTIONS:
  readonly OfferSectionDefinition[] = [
    {
      id: 'unimproved-property',
      title: 'Unimproved property',
      shortTitle: 'Property',
      questions: [
        text('unimproved-lot', 'unimprovedProperty.lot', 'Lot'),
        text('unimproved-block', 'unimprovedProperty.block', 'Block'),
        text('unimproved-addition', 'unimprovedProperty.addition', 'Addition or subdivision'),
        textArea(
          'unimproved-metes-bounds',
          'unimprovedProperty.metesAndBoundsDescription',
          'Metes-and-bounds description'
        ),
        documentUpload(
          'unimproved-legal-description',
          'unimprovedProperty.legalDescriptionExhibitDocumentUid',
          'Legal-description exhibit'
        ),
        textArea(
          'unimproved-intended-use',
          'unimprovedProperty.intendedUse',
          'Intended use'
        ),
        {
          id: 'unimproved-reservations',
          type: 'yes_no',
          fieldPath:
            'unimprovedProperty.reservationsApply',
          label: 'Do reservations apply?',
          validation: {
            required: true,
          },
        },
        {
          ...documentUpload(
            'unimproved-reservation-document',
            'unimprovedProperty.reservationAddendumDocumentUid',
            'Reservation addendum'
          ),
          validation: {
            required: true,
          },
          visibleWhen: trueRule(
            'unimprovedProperty.reservationsApply'
          ),
        },
        {
          id: 'unimproved-feasibility-fee',
          type: 'currency',
          fieldPath:
            'unimprovedProperty.feasibilityFeeInCents',
          label: 'Feasibility fee',
          validation: {
            minimum: 0,
          },
        },
        {
          id: 'unimproved-feasibility-days',
          type: 'number',
          fieldPath:
            'unimprovedProperty.feasibilityPeriodDays',
          label: 'Feasibility period in days',
          validation: {
            required: true,
            minimum: 1,
          },
          visibleWhen: nonZeroRule(
            'unimprovedProperty.feasibilityFeeInCents'
          ),
        },
        {
          id: 'unimproved-utilities',
          type: 'yes_no',
          fieldPath:
            'unimprovedProperty.utilitiesAvailable',
          label: 'Are utilities available?',
          validation: {
            required: true,
          },
        },
        {
          ...textArea(
            'unimproved-utility-information',
            'unimprovedProperty.utilityInformation',
            'Available information concerning utilities'
          ),
          validation: {
            required: true,
          },
          visibleWhen: falseRule(
            'unimprovedProperty.utilitiesAvailable'
          ),
        },
      ],
    },
    TEXAS_SURVEY_SECTION,
    TEXAS_ASSOCIATION_SECTION,
    ...TEXAS_SHARED_TRANSACTION_SECTIONS,
  ];


function text(
  id: string,
  fieldPath: string,
  label: string
) {
  return {
    id,
    type: 'text' as const,
    fieldPath,
    label,
  };
}


function textArea(
  id: string,
  fieldPath: string,
  label: string
) {
  return {
    id,
    type: 'textarea' as const,
    fieldPath,
    label,
  };
}


function documentUpload(
  id: string,
  fieldPath: string,
  label: string
) {
  return {
    id,
    type: 'document_upload' as const,
    fieldPath,
    label,
    acceptedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ],
    maximumFileSizeInBytes:
      20 * 1_048_576,
  };
}


function trueRule(fieldPath: string) {
  return conditionRule(fieldPath, 'is_true');
}


function falseRule(fieldPath: string) {
  return conditionRule(fieldPath, 'is_false');
}


function nonZeroRule(fieldPath: string) {
  return {
    match: 'all' as const,
    conditions: [
      {
        fieldPath,
        operator: 'is_not_empty' as const,
      },
      {
        fieldPath,
        operator: 'not_equals' as const,
        value: 0,
      },
    ],
  };
}


function conditionRule(
  fieldPath: string,
  operator: 'is_true' | 'is_false'
) {
  return {
    match: 'all' as const,
    conditions: [
      {
        fieldPath,
        operator,
      },
    ],
  };
}
