import {
  HttpsError,
} from 'firebase-functions/v2/https';

import {
  DocumentData,
} from 'firebase-admin/firestore';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import type {
  OfferEligibleListing,
} from './offer-types';


const SUPPORTED_OFFER_STATES =
  new Set([
    'NC',
  ]);


/*
 * Loads the published listing and confirms that an
 * authenticated buyer may begin or continue an offer.
 */
export async function verifyOfferEligibility(
  listingUid: string,
  buyerUid: string
): Promise<OfferEligibleListing> {
  const normalizedListingUid =
    requireIdentifier(
      listingUid,
      'listingUid'
    );

  const normalizedBuyerUid =
    requireIdentifier(
      buyerUid,
      'buyerUid'
    );

  const listingReference =
    adminFirestore
      .collection('listings')
      .doc(normalizedListingUid);

  const listingSnapshot =
    await listingReference.get();

  if (!listingSnapshot.exists) {
    throw new HttpsError(
      'not-found',
      'The property listing could not be found.'
    );
  }

  const listingData =
    listingSnapshot.data();

  if (!listingData) {
    throw new HttpsError(
      'not-found',
      'The property listing does not contain any data.'
    );
  }

  const sellerUid =
    readRequiredString(
      listingData,
      'sellerUid',
      'The listing does not identify its seller.'
    );

  if (sellerUid === normalizedBuyerUid) {
    throw new HttpsError(
      'failed-precondition',
      'You cannot submit an offer on your own property.'
    );
  }

  const listingStatus =
    readRequiredString(
      listingData,
      'status',
      'The listing does not contain a valid status.'
    )
      .trim()
      .toLowerCase();

  if (listingStatus !== 'active') {
    throw new HttpsError(
      'failed-precondition',
      'This property is not currently accepting offers.'
    );
  }

  /*
   * Existing published listings may not yet contain the
   * acceptingOffers field. An active listing is treated as
   * accepting offers unless the seller or system has
   * explicitly set the field to false.
   */
  if (listingData['acceptingOffers'] === false) {
    throw new HttpsError(
      'failed-precondition',
      'The seller is not currently accepting offers for this property.'
    );
  }

  const stateCode =
    readRequiredString(
      listingData,
      'state',
      'The listing does not identify its state.'
    )
      .trim()
      .toUpperCase();

  if (!SUPPORTED_OFFER_STATES.has(stateCode)) {
    throw new HttpsError(
      'failed-precondition',
      `NavStreet offers are not yet available in ${stateCode}.`
    );
  }

  const listPrice =
    readRequiredNumber(
      listingData,
      'listPrice',
      'The listing does not contain a valid list price.'
    );

  if (listPrice <= 0) {
    throw new HttpsError(
      'failed-precondition',
      'The listing does not contain a valid list price.'
    );
  }

  return {
    Uid: listingSnapshot.id,

    sellerUid,

    status: listingStatus,

    acceptingOffers:
      listingData['acceptingOffers'] !==
      false,

    addressLine1:
      readRequiredString(
        listingData,
        'addressLine1',
        'The listing does not contain a street address.'
      ),

    addressLine2:
      readOptionalString(
        listingData,
        'addressLine2'
      ),

    city:
      readRequiredString(
        listingData,
        'city',
        'The listing does not contain a city.'
      ),

    state: stateCode,

    zipCode:
      readRequiredString(
        listingData,
        'zipCode',
        'The listing does not contain a ZIP code.'
      ),

    county:
      readRequiredString(
        listingData,
        'county',
        'The listing does not contain a county.'
      ),

    parcelIdentificationNumber:
      readFirstOptionalString(
        listingData,
        [
          'parcelIdentificationNumber',
          'parcelNumber',
        ]
      ),

    deedBook:
      readOptionalString(
        listingData,
        'deedBook'
      ),

    deedPage:
      readOptionalString(
        listingData,
        'deedPage'
      ),

    legalDescription:
      readOptionalString(
        listingData,
        'legalDescription'
      ),

    propertyType:
      readRequiredString(
        listingData,
        'propertyType',
        'The listing does not identify the property type.'
      ),

    listPrice,

    createdAt:
      listingData['createdAt'],

    updatedAt:
      listingData['updatedAt'],
  };
}


/*
 * Rechecks eligibility immediately before a legally
 * significant offer transition.
 *
 * This prevents a buyer from submitting an offer from a
 * stale browser page after the property has already become
 * under contract, paused, sold or withdrawn.
 */
export async function verifyOfferSubmissionEligibility(
  listingUid: string,
  buyerUid: string
): Promise<OfferEligibleListing> {
  return verifyOfferEligibility(
    listingUid,
    buyerUid
  );
}


function requireIdentifier(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0
  ) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} is required.`
    );
  }

  const normalizedValue =
    value.trim();

  if (
    normalizedValue.length > 200 ||
    normalizedValue.includes('/')
  ) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} is invalid.`
    );
  }

  return normalizedValue;
}


function readRequiredString(
  data: DocumentData,
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
  data: DocumentData,
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


function readFirstOptionalString(
  data: DocumentData,
  fieldNames: string[]
): string | undefined {
  for (const fieldName of fieldNames) {
    const value =
      readOptionalString(
        data,
        fieldName
      );

    if (value) {
      return value;
    }
  }

  return undefined;
}


function readRequiredNumber(
  data: DocumentData,
  fieldName: string,
  errorMessage: string
): number {
  const value =
    data[fieldName];

  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    throw new HttpsError(
      'failed-precondition',
      errorMessage
    );
  }

  return value;
}