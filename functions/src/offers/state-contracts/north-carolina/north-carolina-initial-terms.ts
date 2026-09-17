import {
  HttpsError,
} from 'firebase-functions/v2/https';

import type {
  OfferTermsDocument,
} from '../../offer-types';

import type {
  CreateInitialOfferTermsInput,
} from '../state-contract-package';


interface NorthCarolinaContractConfiguration {
  stateCode: 'NC';

  defaultTimeZone:
  'America/New_York';
}


/*
 * Creates the initial editable terms for a North
 * Carolina offer.
 *
 * All North Carolina-specific defaults and listing
 * representations belong in this state package.
 */
export function createNorthCarolinaInitialOfferTerms(
  input: CreateInitialOfferTermsInput,
  configuration:
    NorthCarolinaContractConfiguration
): OfferTermsDocument {
  const listPriceInCents =
    input.property.listPriceInCents;

  const sellerStatements =
    createSellerStatementsSnapshot(
      input.listingData
    );

  return {
    stateCode:
      configuration.stateCode,

    property:
      input.property,

    propertyTerms: {
      manufacturedHomeIncluded: false,

      separatePropertyIncluded: false,
    },

    purchase: {
      purchasePriceInCents:
        listPriceInCents,

      financingType:
        'unselected',

      otherPropertyWillFundPurchase:
        false,
    },

    deposits: {
      depositInCents: 0,

      depositDeliveryDays: 4,

      escrowAgentName: '',

      dueDiligenceDeadlineType:
        'unselected',

      dueDiligenceEndTime:
        '17:00',
    },

    concessions: {
      concessionType: 'none',

      homeWarrantyRequested: false,
    },

    settlement: {
      settlementDate: '',

      possessionTiming:
        'at_closing',
    },

    buyerDisclosures: {
      residentialProperty: {
        status: 'unselected',

        acknowledged: false,
      },

      mineralOilGasRights: {
        status: 'unselected',

        acknowledged: false,
      },
    },

    sellerStatements,

    addenda: [],

    additionalTermsExhibit: {
      included: false,
    },

    delivery: {
      expiresAt: '',

      timeZone:
        configuration.defaultTimeZone,

      buyerDeliveryEmail:
        input.buyer.email,

      sellerDeliveryEmail:
        input.seller.email,

      electronicDeliveryAuthorized:
        false,
    },
  };
}


function createSellerStatementsSnapshot(
  listingData: Record<string, unknown>
): OfferTermsDocument['sellerStatements'] {
  const value =
    listingData['sellerStatements'];

  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The seller must complete the listing representations before this property can receive offers.'
    );
  }

  const statements =
    value as Record<string, unknown>;

  const ownershipStatus =
    readRequiredString(
      statements,
      'ownershipStatus',
      'The listing does not contain a valid seller ownership statement.'
    );

  if (
    ownershipStatus !==
    'owned_at_least_one_year' &&
    ownershipStatus !==
    'owned_less_than_one_year' &&
    ownershipStatus !==
    'does_not_yet_own'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The listing does not contain a valid seller ownership statement.'
    );
  }

  const leadBasedPaintApplies =
    readRequiredBoolean(
      statements,
      'leadBasedPaintApplies',
      'The listing does not contain a lead-based-paint statement.'
    );

  const ownersAssociationApplies =
    readRequiredBoolean(
      statements,
      'ownersAssociationApplies',
      'The listing does not contain an owners-association statement.'
    );

  const fuelTankPresent =
    readRequiredBoolean(
      statements,
      'fuelTankPresent',
      'The listing does not contain a fuel-tank statement.'
    );

  const leasesExist =
    readRequiredBoolean(
      statements,
      'leasesExist',
      'The listing does not contain an existing-leases statement.'
    );

  const fuelTankOwnership =
    readOptionalString(
      statements,
      'fuelTankOwnership'
    );

  if (
    fuelTankPresent &&
    fuelTankOwnership !== 'owned' &&
    fuelTankOwnership !== 'leased'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The listing does not contain a valid fuel-tank ownership statement.'
    );
  }

  const ownersAssociationDuesInCents =
    statements[
    'ownersAssociationDuesInCents'
    ];

  if (
    ownersAssociationDuesInCents !==
    undefined &&
    (
      typeof ownersAssociationDuesInCents !==
      'number' ||
      !Number.isFinite(
        ownersAssociationDuesInCents
      ) ||
      ownersAssociationDuesInCents < 0
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The listing does not contain valid owners-association dues.'
    );
  }

  return {
    ownershipStatus,

    leadBasedPaintApplies,

    leadBasedPaintDisclosureDocumentUid:
      readOptionalString(
        statements,
        'leadBasedPaintDisclosureDocumentUid'
      ),

    ownersAssociationApplies,

    ownersAssociationName:
      readOptionalString(
        statements,
        'ownersAssociationName'
      ),

    ownersAssociationDuesInCents:
      typeof ownersAssociationDuesInCents ===
        'number'
        ? Math.round(
          ownersAssociationDuesInCents
        )
        : undefined,

    ownersAssociationDuesFrequency:
      readOptionalString(
        statements,
        'ownersAssociationDuesFrequency'
      ),

    ownersAssociationContact:
      readOptionalString(
        statements,
        'ownersAssociationContact'
      ),

    fuelTankPresent,

    fuelTankOwnership:
      fuelTankPresent
        ? fuelTankOwnership
        : undefined,

    leasesExist,

    leaseAddendumDocumentUid:
      readOptionalString(
        statements,
        'leaseAddendumDocumentUid'
      ),
  } as OfferTermsDocument[
    'sellerStatements'
    ];
}


function readRequiredString(
  data: Record<string, unknown>,
  fieldName: string,
  errorMessage: string
): string {
  const value =
    data[fieldName];

  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new HttpsError(
      'failed-precondition',
      errorMessage
    );
  }

  return value.trim();
}


function readOptionalString(
  data: Record<string, unknown>,
  fieldName: string
): string | undefined {
  const value =
    data[fieldName];

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalizedValue =
    value.trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : undefined;
}


function readRequiredBoolean(
  data: Record<string, unknown>,
  fieldName: string,
  errorMessage: string
): boolean {
  const value =
    data[fieldName];

  if (typeof value !== 'boolean') {
    throw new HttpsError(
      'failed-precondition',
      errorMessage
    );
  }

  return value;
}