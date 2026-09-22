import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  HttpsError,
} from 'firebase-functions/v2/https';

import type {
  OfferTermsDocument,
} from '../../offer-types';

import type {
  SanitizeDraftTermsInput,
} from '../state-contract-package';


interface NorthCarolinaDraftConfiguration {
  stateCode: 'NC';

  defaultTimeZone:
    'America/New_York';
}


export function sanitizeNorthCarolinaDraftTerms(
  input:
    SanitizeDraftTermsInput,

  configuration:
    NorthCarolinaDraftConfiguration
): OfferTermsDocument {
  if (
    input.requestedTerms === null ||
    typeof input.requestedTerms !==
      'object' ||
    Array.isArray(
      input.requestedTerms
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Offer terms must be an object.'
    );
  }

  const terms =
    structuredCloneSafe(
      input.requestedTerms as
        Record<string, unknown>
    );

  /*
   * State and property are trusted backend snapshots.
   */
  terms['stateCode'] =
    configuration.stateCode;

  terms['property'] =
    input.currentTerms.property;

  /*
   * North Carolina requires the contractual
   * 5:00 p.m. due-diligence deadline time.
   */
  const requestedDeposits =
    requireObject(
      terms['deposits'],
      'Deposit terms must be an object.'
    );

  requestedDeposits[
    'dueDiligenceEndTime'
  ] = '17:00';

  const requestedDelivery =
    requireObject(
      terms['delivery'],
      'Delivery terms must be an object.'
    );

  /*
   * Account delivery addresses cannot be replaced
   * by browser-submitted values.
   */
  requestedDelivery[
    'buyerDeliveryEmail'
  ] = input.currentTerms
    .delivery
    .buyerDeliveryEmail;

  requestedDelivery[
    'sellerDeliveryEmail'
  ] = input.currentTerms
    .delivery
    .sellerDeliveryEmail;

  requestedDelivery['timeZone'] =
    configuration.defaultTimeZone;

  if (
    input.initiatedBy ===
      'buyer'
  ) {
    terms['sellerStatements'] =
      input.currentTerms
        .sellerStatements;
  } else {
    terms['buyerDisclosures'] =
      input.currentTerms
        .buyerDisclosures;
  }

  rejectUnsafeObjectKeys(
    terms
  );

  return removeUndefinedValues(
    terms
  ) as unknown as
    OfferTermsDocument;
}


function requireObject(
  value: unknown,
  message: string
): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    throw new HttpsError(
      'invalid-argument',
      message
    );
  }

  return value as
    Record<string, unknown>;
}


function rejectUnsafeObjectKeys(
  value: Record<string, unknown>
): void {
  const unsafeKeys =
    new Set([
      '__proto__',
      'prototype',
      'constructor',
    ]);

  const inspect =
    (
      nestedValue: unknown
    ): void => {
      if (
        Array.isArray(
          nestedValue
        )
      ) {
        nestedValue.forEach(
          inspect
        );

        return;
      }

      if (
        nestedValue === null ||
        typeof nestedValue !==
          'object'
      ) {
        return;
      }

      for (
        const [
          key,
          childValue,
        ] of Object.entries(
          nestedValue as
            Record<string, unknown>
        )
      ) {
        if (
          unsafeKeys.has(key)
        ) {
          throw new HttpsError(
            'invalid-argument',
            'The offer changes contain an invalid field.'
          );
        }

        inspect(
          childValue
        );
      }
    };

  inspect(value);
}


function structuredCloneSafe(
  value: Record<string, unknown>
): Record<string, unknown> {
  try {
    return JSON.parse(
      JSON.stringify(value)
    ) as Record<string, unknown>;
  } catch {
    throw new HttpsError(
      'invalid-argument',
      'The offer terms could not be processed.'
    );
  }
}


function removeUndefinedValues<T>(
  value: T
): T {
  if (Array.isArray(value)) {
    return value.map(
      item =>
        removeUndefinedValues(
          item
        )
    ) as T;
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof Timestamp) &&
    !(value instanceof FieldValue)
  ) {
    return Object.fromEntries(
      Object.entries(
        value as
          Record<string, unknown>
      )
        .filter(
          ([, nestedValue]) =>
            nestedValue !==
              undefined
        )
        .map(
          ([
            key,
            nestedValue,
          ]) => [
            key,
            removeUndefinedValues(
              nestedValue
            ),
          ]
        )
    ) as T;
  }

  return value;
}