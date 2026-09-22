import type {
  OfferSectionDefinition,
} from '../../../../engine/models/offer-section-definition';

import {
  TEXAS_DISCLOSURES_SECTION,
  TEXAS_LEASES_SECTION,
  TEXAS_PROPERTY_TERMS_SECTION,
  TEXAS_SHARED_TRANSACTION_SECTIONS,
} from '../../questions/texas-shared-question-definitions';


const DOCUMENT_STATUS_OPTIONS = [
  {
    value: 'received',
    label: 'Received',
  },
  {
    value: 'not_received',
    label: 'Not received',
  },
  {
    value: 'waived',
    label: 'Waived',
  },
] as const;


const DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;


const MAXIMUM_DOCUMENT_SIZE =
  20 * 1_048_576;


export const TEXAS_CONDOMINIUM_RESALE_SECTIONS:
  readonly OfferSectionDefinition[] = [
    {
      id: 'condominium-property',
      title: 'Condominium property',
      shortTitle: 'Condominium',
      questions: [
        {
          id: 'condominium-unit-number',
          type: 'text',
          fieldPath: 'condominiumProperty.unitNumber',
          label: 'Unit number',
          validation: {
            required: true,
          },
        },
        {
          id: 'condominium-building-number',
          type: 'text',
          fieldPath: 'condominiumProperty.buildingNumber',
          label: 'Building number',
        },
        {
          id: 'condominium-project-name',
          type: 'text',
          fieldPath:
            'condominiumProperty.condominiumProjectName',
          label: 'Condominium project name',
          validation: {
            required: true,
          },
        },
        {
          id: 'condominium-parking',
          type: 'text',
          fieldPath: 'condominiumProperty.parkingAreas',
          label: 'Assigned parking areas',
        },
        {
          id: 'condominium-documents-status',
          type: 'single_choice',
          fieldPath:
            'condominiumProperty.condominiumDocumentsStatus',
          label: 'Condominium documents status',
          options: DOCUMENT_STATUS_OPTIONS,
          validation: {
            required: true,
          },
        },
        {
          id: 'condominium-documents-days',
          type: 'number',
          fieldPath:
            'condominiumProperty.condominiumDocumentsDeliveryDays',
          label: 'Condominium-document delivery period in days',
          validation: {
            required: true,
            minimum: 1,
          },
          visibleWhen: equalsRule(
            'condominiumProperty.condominiumDocumentsStatus',
            'not_received'
          ),
        },
        {
          id: 'resale-certificate-status',
          type: 'single_choice',
          fieldPath:
            'condominiumProperty.resaleCertificateStatus',
          label: 'Resale-certificate status',
          options: DOCUMENT_STATUS_OPTIONS,
          validation: {
            required: true,
          },
        },
        {
          id: 'resale-certificate-document',
          type: 'document_upload',
          fieldPath:
            'condominiumProperty.resaleCertificateDocumentUid',
          label: 'Received resale certificate',
          acceptedMimeTypes: DOCUMENT_TYPES,
          maximumFileSizeInBytes: MAXIMUM_DOCUMENT_SIZE,
          validation: {
            required: true,
          },
          visibleWhen: equalsRule(
            'condominiumProperty.resaleCertificateStatus',
            'received'
          ),
        },
        {
          id: 'resale-certificate-days',
          type: 'number',
          fieldPath:
            'condominiumProperty.resaleCertificateDeliveryDays',
          label: 'Resale-certificate delivery period in days',
          validation: {
            required: true,
            minimum: 1,
          },
          visibleWhen: equalsRule(
            'condominiumProperty.resaleCertificateStatus',
            'not_received'
          ),
        },
        {
          id: 'right-of-refusal-days',
          type: 'number',
          fieldPath:
            'condominiumProperty.rightOfRefusalCertificationDays',
          label: 'Right-of-refusal certification period in days',
          validation: {
            minimum: 1,
          },
        },
      ],
    },
    TEXAS_PROPERTY_TERMS_SECTION,
    TEXAS_LEASES_SECTION,
    TEXAS_DISCLOSURES_SECTION,
    ...TEXAS_SHARED_TRANSACTION_SECTIONS,
  ];


function equalsRule(
  fieldPath: string,
  value: unknown
) {
  return {
    match: 'all' as const,
    conditions: [
      {
        fieldPath,
        operator: 'equals' as const,
        value,
      },
    ],
  };
}
