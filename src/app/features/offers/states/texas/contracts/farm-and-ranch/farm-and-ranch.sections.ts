import type {
  OfferSectionDefinition,
} from '../../../../engine/models/offer-section-definition';

import {
  TEXAS_DISCLOSURES_SECTION,
  TEXAS_LEASES_SECTION,
  TEXAS_SHARED_TRANSACTION_SECTIONS,
  TEXAS_SURVEY_SECTION,
} from '../../questions/texas-shared-question-definitions';


export const TEXAS_FARM_AND_RANCH_SECTIONS:
  readonly OfferSectionDefinition[] = [
    {
      id: 'farm-ranch-property',
      title: 'Farm and ranch property',
      shortTitle: 'Property',
      questions: [
        {
          id: 'farm-land-description',
          type: 'textarea',
          fieldPath:
            'farmAndRanchProperty.landDescription',
          label: 'Land description',
          validation: {
            required: true,
          },
        },
        {
          id: 'farm-acreage',
          type: 'number',
          fieldPath:
            'farmAndRanchProperty.approximateAcreage',
          label: 'Approximate acreage',
          validation: {
            minimum: 0.01,
          },
        },
        textArea(
          'farm-improvements',
          'farmAndRanchProperty.improvementsDescription',
          'Improvements'
        ),
        textArea(
          'farm-accessories',
          'farmAndRanchProperty.accessoriesDescription',
          'Accessories'
        ),
        textArea(
          'farm-crops',
          'farmAndRanchProperty.cropsDescription',
          'Crops'
        ),
        textArea(
          'farm-exclusions',
          'farmAndRanchProperty.exclusions',
          'Exclusions'
        ),
        {
          id: 'farm-reservations',
          type: 'yes_no',
          fieldPath:
            'farmAndRanchProperty.reservationsApply',
          label: 'Do reservations apply?',
          validation: {
            required: true,
          },
        },
        documentUpload(
          'farm-reservation-document',
          'farmAndRanchProperty.reservationAddendumDocumentUid',
          'Reservation addendum',
          trueRule(
            'farmAndRanchProperty.reservationsApply'
          )
        ),
        {
          id: 'farm-agricultural-leases',
          type: 'yes_no',
          fieldPath:
            'farmAndRanchProperty.existingAgriculturalLeasesExist',
          label: 'Do agricultural leases exist?',
          validation: {
            required: true,
          },
        },
        {
          id: 'farm-agricultural-leases-delivered',
          type: 'yes_no',
          fieldPath:
            'farmAndRanchProperty.agriculturalLeaseDocumentsDelivered',
          label: 'Have the agricultural lease documents been delivered?',
          validation: {
            required: true,
          },
          visibleWhen: trueRule(
            'farmAndRanchProperty.existingAgriculturalLeasesExist'
          ),
        },
        {
          id: 'farm-rollback-tax-payer',
          type: 'single_choice',
          fieldPath:
            'farmAndRanchProperty.rollbackTaxesExpensePayer',
          label: 'Who pays any rollback taxes?',
          options: [
            {
              value: 'buyer',
              label: 'Buyer',
            },
            {
              value: 'seller',
              label: 'Seller',
            },
          ],
          validation: {
            required: true,
          },
        },
      ],
    },
    TEXAS_LEASES_SECTION,
    TEXAS_SURVEY_SECTION,
    TEXAS_DISCLOSURES_SECTION,
    ...TEXAS_SHARED_TRANSACTION_SECTIONS,
  ];


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
  label: string,
  visibleWhen: ReturnType<typeof trueRule>
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
    validation: {
      required: true,
    },
    visibleWhen,
  };
}


function trueRule(fieldPath: string) {
  return {
    match: 'all' as const,
    conditions: [
      {
        fieldPath,
        operator: 'is_true' as const,
      },
    ],
  };
}
