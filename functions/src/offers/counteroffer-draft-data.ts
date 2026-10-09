import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { removeUndefinedValues } from './draft-value-cleanup';
import type { OfferTermsDocument, OfferVersionPartySnapshotDocument } from './offer-types';

/** Prepare editable counteroffer data without changing the source signed version. */
export function resetPartySignatures(
  parties:
    OfferVersionPartySnapshotDocument[]
): OfferVersionPartySnapshotDocument[] {
  return parties.map(
    party =>
      removeUndefinedValues({
        ...party,

        signature: {
          status:
            'not_started'
        },

        electronicTransactionsConsentAccepted:
          false,

        electronicTransactionsConsentAcceptedAt:
          undefined
      }) as
      OfferVersionPartySnapshotDocument
  );
}


export function createCounterofferTerms(
  sourceTerms: OfferTermsDocument
): OfferTermsDocument {
  const terms =
    clonePlainValue(
      sourceTerms
    );

  return {
    ...terms,

    delivery: {
      ...terms.delivery,

      expiresAt: '',

      electronicDeliveryAuthorized:
        false
    }
  };
}


function clonePlainValue<T>(
  value: T
): T {
  if (Array.isArray(value)) {
    return value.map(
      item =>
        clonePlainValue(item)
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
        value as Record<string, unknown>
      ).map(
        ([key, nestedValue]) => [
          key,
          clonePlainValue(
            nestedValue
          )
        ]
      )
    ) as T;
  }

  return value;
}
