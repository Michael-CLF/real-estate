import { COLORADO_FACT_DEFAULTS, type ColoradoPropertyFacts } from '../offers/state-contracts/colorado/colorado-contract-elections';
import { CALIFORNIA_DISCLOSURE_TYPES, validCaliforniaDisclosureDecision, type CaliforniaDisclosureDecision, type CaliforniaDisclosureType } from './state-listing-packages/california-listing-facts';
import * as logger from 'firebase-functions/logger';
import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';
import {
  FieldValue,
  Timestamp
} from 'firebase-admin/firestore';
import {
  adminFirestore
} from '../shared/firebase-admin';
import {
  callableFunctionOptions
} from '../shared/function-options';
type EditableHoaFeeFrequency =
  | 'monthly'
  | 'quarterly'
  | 'semi_annually'
  | 'annually';
interface EditableHoa {
  hasHoa: boolean;
  feeAmount: number | null;
  feeFrequency:
    EditableHoaFeeFrequency | null;
}
interface PublishedListingChanges {
  legalDescription?: string;
  coloradoPropertyFacts?: ColoradoPropertyFacts;
  californiaDisclosure?: { documentType: CaliforniaDisclosureType; decision: CaliforniaDisclosureDecision };
  listPrice?: number;
  description?: string;
  hoa?: EditableHoa;
}
interface UpdatePublishedListingData {
  listingUid: string;
  changes: PublishedListingChanges;
}
interface UpdatePublishedListingResponse {
  listingUid: string;
  updatedFields: string[];
  priceChanged: boolean;
}
const EDITABLE_FIELDS =
  new Set([
    'californiaDisclosure',
    'coloradoPropertyFacts',
    'legalDescription',
    'listPrice',
    'description',
    'hoa'
  ]);
const HOA_FEE_FREQUENCIES =
  new Set<EditableHoaFeeFrequency>([
    'monthly',
    'quarterly',
    'semi_annually',
    'annually'
  ]);
/**
 * Securely updates the limited fields a seller may
 * change after a listing has been published.
 *
 * Price changes are recorded in:
 *
 * listings/{listingUid}/priceHistory/{priceHistoryUid}
 */
export const updatePublishedListing =
  onCall<
    UpdatePublishedListingData,
    Promise<UpdatePublishedListingResponse>
  >(
    {
      ...callableFunctionOptions
    },
    async request => {
      const authenticatedUserUid =
        request.auth?.uid;
      if (!authenticatedUserUid) {
        throw new HttpsError(
          'unauthenticated',
          'Sign in before editing a listing.'
        );
      }
      const validatedInput =
        validateUpdateInput(
          request.data
        );
      const listingReference =
        adminFirestore
          .collection('listings')
          .doc(validatedInput.listingUid);
      try {
        const transactionResult =
          await adminFirestore.runTransaction(
            async transaction => {
              const listingSnapshot =
                await transaction.get(
                  listingReference
                );
              if (!listingSnapshot.exists) {
                throw new HttpsError(
                  'not-found',
                  'The selected listing could not be found.'
                );
              }
              const listingData =
                listingSnapshot.data();
              if (!listingData) {
                throw new HttpsError(
                  'data-loss',
                  'The selected listing contains no data.'
                );
              }
              if (
                listingData['sellerUid'] !==
                authenticatedUserUid
              ) {
                throw new HttpsError(
                  'permission-denied',
                  'Only the listing owner may edit this listing.'
                );
              }
              const listingStatus =
                readRequiredString(
                  listingData['status'],
                  'Listing status'
                );
              if (
                listingStatus === 'sold' ||
                listingStatus === 'withdrawn' ||
                listingStatus === 'expired'
              ) {
                throw new HttpsError(
                  'failed-precondition',
                  'This listing cannot be edited in its current status.'
                );
              }
              const timestamp =
                Timestamp.now();
              const updates:
                Record<string, unknown> = {};
              const updatedFields:
                string[] = [];
              let priceChanged = false;
              if (validatedInput.changes.californiaDisclosure) {
                if (listingData['state'] !== 'CA') throw new HttpsError('failed-precondition', 'California disclosure applicability is only available for California listings.');
                const { documentType, decision } = validatedInput.changes.californiaDisclosure;
                updates[`sellerStatements.california.disclosureApplicability.${documentType}`] = decision;
                updatedFields.push('californiaDisclosure');
              }
              if (validatedInput.changes.legalDescription !== undefined) {
                if (listingData['state'] !== 'CO' || listingStatus !== 'active' || listingData['activeContractUid']) {
                  throw new HttpsError('failed-precondition', 'Colorado legal descriptions can only be edited on an active Colorado listing outside a contract.');
                }
                if ((listingData['legalDescription'] ?? '') !== validatedInput.changes.legalDescription) {
                  updates['legalDescription'] = validatedInput.changes.legalDescription;
                  updatedFields.push('legalDescription');
                }
              }
              if (validatedInput.changes.coloradoPropertyFacts) {
                if (listingData['state'] !== 'CO' || listingStatus !== 'active' || listingData['activeContractUid']) {
                  throw new HttpsError('failed-precondition', 'Colorado seller facts can only be edited on an active Colorado listing outside a contract.');
                }
                const currentFacts = isRecord(listingData['coloradoPropertyFacts']) ? listingData['coloradoPropertyFacts'] : {};
                for (const [key, value] of Object.entries(validatedInput.changes.coloradoPropertyFacts)) {
                  if (currentFacts[key] !== value) {
                    updates[`coloradoPropertyFacts.${key}`] = value;
                    updatedFields.push(`coloradoPropertyFacts.${key}`);
                  }
                }
              }
              /*
               * LIST PRICE
               */
              if (
                validatedInput.changes
                  .listPrice !== undefined
              ) {
                const previousPrice =
                  readRequiredNumber(
                    listingData['listPrice'],
                    'Current listing price'
                  );
                const newPrice =
                  validatedInput.changes
                    .listPrice;
                if (
                  newPrice !== previousPrice
                ) {
                  priceChanged = true;
                  updates['listPrice'] =
                    newPrice;
                  updates['priceChangedAt'] =
                    timestamp;
                  updatedFields.push(
                    'listPrice'
                  );
                  const priceHistoryReference =
                    listingReference
                      .collection('priceHistory')
                      .doc();
                  transaction.set(
                    priceHistoryReference,
                    {
                      priceHistoryUid:
                        priceHistoryReference.id,
                      listingUid:
                        validatedInput.listingUid,
                      sellerUid:
                        authenticatedUserUid,
                      previousPrice,
                      newPrice,
                      changeType:
                        newPrice < previousPrice
                          ? 'price_reduction'
                          : 'price_increase',
                      changedByUid:
                        authenticatedUserUid,
                      changedAt:
                        timestamp
                    }
                  );
                }
              }
              /*
               * DESCRIPTION
               */
              if (
                validatedInput.changes
                  .description !== undefined
              ) {
                const existingDescription =
                  typeof listingData[
                    'description'
                  ] === 'string'
                    ? listingData[
                      'description'
                    ]
                    : '';
                const newDescription =
                  validatedInput.changes
                    .description;
                if (
                  newDescription !==
                  existingDescription
                ) {
                  updates['description'] =
                    newDescription;
                  updatedFields.push(
                    'description'
                  );
                }
              }
              /*
               * HOA
               *
               * Dot-path updates preserve any future or
               * existing HOA information not controlled
               * by this editor.
               */
              if (
                validatedInput.changes
                  .hoa !== undefined
              ) {
                applyHoaChanges(
                  validatedInput.changes.hoa,
                  listingData['hoa'],
                  updates,
                  updatedFields
                );
              }
              if (
                updatedFields.length === 0
              ) {
                return {
                  updatedFields,
                  priceChanged
                };
              }
              updates['updatedAt'] =
                timestamp;
              transaction.update(
                listingReference,
                updates
              );
              return {
                updatedFields,
                priceChanged
              };
            }
          );
        logger.info(
          'Published listing updated.',
          {
            listingUid:
              validatedInput.listingUid,
            sellerUid:
              authenticatedUserUid,
            updatedFields:
              transactionResult
                .updatedFields,
            priceChanged:
              transactionResult
                .priceChanged
          }
        );
        return {
          listingUid:
            validatedInput.listingUid,
          updatedFields:
            transactionResult
              .updatedFields,
          priceChanged:
            transactionResult
              .priceChanged
        };
      } catch (error: unknown) {
        if (error instanceof HttpsError) {
          throw error;
        }
        logger.error(
          'Unable to update published listing.',
          {
            listingUid:
              validatedInput.listingUid,
            sellerUid:
              authenticatedUserUid,
            error
          }
        );
        throw new HttpsError(
          'internal',
          'We could not update this listing. Please try again.'
        );
      }
    }
  );
function validateUpdateInput(
  value: unknown
): UpdatePublishedListingData {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'Listing update information is required.'
    );
  }
  const listingUid =
    readRequiredString(
      value['listingUid'],
      'Listing UID'
    );
  const changesValue =
    value['changes'];
  if (!isRecord(changesValue)) {
    throw new HttpsError(
      'invalid-argument',
      'Listing changes are required.'
    );
  }
  const changeKeys =
    Object.keys(changesValue);
  if (changeKeys.length === 0) {
    throw new HttpsError(
      'invalid-argument',
      'At least one listing change is required.'
    );
  }
  const unsupportedField =
    changeKeys.find(
      key => !EDITABLE_FIELDS.has(key)
    );
  if (unsupportedField) {
    throw new HttpsError(
      'invalid-argument',
      `${unsupportedField} cannot be edited after publication.`
    );
  }
  const changes:
    PublishedListingChanges = {};
  if (
    changesValue['listPrice'] !==
    undefined
  ) {
    changes.listPrice =
      readNumberWithinRange(
        changesValue['listPrice'],
        'Listing price',
        1,
        1_000_000_000
      );
  }
  if (
    changesValue['description'] !==
    undefined
  ) {
    const description =
      readRequiredString(
        changesValue['description'],
        'Property description'
      );
    if (
      description.length < 20 ||
      description.length > 5_000
    ) {
      throw new HttpsError(
        'invalid-argument',
        'The property description must contain between 20 and 5,000 characters.'
      );
    }
    changes.description =
      description;
  }
  if (
    changesValue['hoa'] !==
    undefined
  ) {
    changes.hoa =
      validateHoa(
        changesValue['hoa']
      );
  }
  if (changesValue['legalDescription'] !== undefined) {
    const description = changesValue['legalDescription'];
    if (typeof description !== 'string' || description.length > 5000) {
      throw new HttpsError('invalid-argument', 'Legal description must be text within 5,000 characters.');
    }
    changes.legalDescription = description.trim();
  }
  if (changesValue['coloradoPropertyFacts'] !== undefined) {
    const value = changesValue['coloradoPropertyFacts'];
    if (!isRecord(value)) throw new HttpsError('invalid-argument', 'Colorado property facts must be an object.');
    const facts = Object.fromEntries(Object.entries(COLORADO_FACT_DEFAULTS).map(([key, fallback]) => {
      const supplied = value[key];
      if (supplied !== undefined && (typeof supplied !== 'string' || supplied.length > 4000)) {
        throw new HttpsError('invalid-argument', 'Colorado property facts must be text within 4,000 characters.');
      }
      return [key, typeof supplied === 'string' ? supplied.trim() : fallback];
    })) as unknown as ColoradoPropertyFacts;
    if (!facts.waterSource || !['covered', 'not_applicable'].includes(facts.metroDistrict) ||
      (facts.metroDistrict === 'covered' && (!/^https:\/\/[^\s]+$/.test(facts.metroDistrictWebsite) || !facts.metroDistrictDisclosure))) {
      throw new HttpsError('invalid-argument', 'Complete the water source, district answer and applicable district website and records reference.');
    }
    changes.coloradoPropertyFacts = facts;
  }
  const californiaValue = changesValue['californiaDisclosure'];
  if (californiaValue !== undefined) {
    if (!isRecord(californiaValue) || !CALIFORNIA_DISCLOSURE_TYPES.includes(californiaValue['documentType'] as CaliforniaDisclosureType) ||
      !validCaliforniaDisclosureDecision(californiaValue['decision'])) {
      throw new HttpsError('invalid-argument', 'Choose applicability and explain any exemption or non-applicability (maximum 5,000 characters).');
    }
    const decision = californiaValue['decision'];
    changes.californiaDisclosure = { documentType: californiaValue['documentType'] as CaliforniaDisclosureType, decision: { status: decision.status, basis: decision.basis.trim() } };
  }
  return {
    listingUid,
    changes
  };
}
function validateHoa(
  value: unknown
): EditableHoa {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'HOA information is invalid.'
    );
  }
  const hasHoa =
    value['hasHoa'];
  if (typeof hasHoa !== 'boolean') {
    throw new HttpsError(
      'invalid-argument',
      'Select whether the property has an HOA.'
    );
  }
  if (!hasHoa) {
    return {
      hasHoa: false,
      feeAmount: null,
      feeFrequency: null
    };
  }
  const feeAmount =
    readNumberWithinRange(
      value['feeAmount'],
      'HOA fee',
      0,
      1_000_000
    );
  const feeFrequency =
    readRequiredString(
      value['feeFrequency'],
      'HOA fee frequency'
    ) as EditableHoaFeeFrequency;
  if (
    !HOA_FEE_FREQUENCIES.has(
      feeFrequency
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Select a valid HOA fee frequency.'
    );
  }
  return {
    hasHoa: true,
    feeAmount,
    feeFrequency
  };
}
function applyHoaChanges(
  hoa: EditableHoa,
  existingHoaValue: unknown,
  updates: Record<string, unknown>,
  updatedFields: string[]
): void {
  const existingHoa =
    isRecord(existingHoaValue)
      ? existingHoaValue
      : {};
  const existingHasHoa =
    existingHoa['hasHoa'] === true;
  const existingFeeAmount =
    typeof existingHoa[
      'feeAmount'
    ] === 'number'
      ? existingHoa['feeAmount']
      : null;
  const existingFeeFrequency =
    typeof existingHoa[
      'feeFrequency'
    ] === 'string'
      ? existingHoa['feeFrequency']
      : null;
  let hoaChanged = false;
  if (
    hoa.hasHoa !==
    existingHasHoa
  ) {
    updates['hoa.hasHoa'] =
      hoa.hasHoa;
    hoaChanged = true;
  }
  /*
   * Existing ListingHoa records require this array.
   * Only add it when an older listing does not
   * already contain it.
   */
  if (
    !Array.isArray(
      existingHoa['includedItems']
    )
  ) {
    updates['hoa.includedItems'] =
      [];
    hoaChanged = true;
  }
  if (hoa.hasHoa) {
    if (
      hoa.feeAmount !==
      existingFeeAmount
    ) {
      updates['hoa.feeAmount'] =
        hoa.feeAmount;
      hoaChanged = true;
    }
    if (
      hoa.feeFrequency !==
      existingFeeFrequency
    ) {
      updates['hoa.feeFrequency'] =
        hoa.feeFrequency;
      hoaChanged = true;
    }
  } else {
    if (
      existingHoa[
        'feeAmount'
      ] !== undefined
    ) {
      updates['hoa.feeAmount'] =
        FieldValue.delete();
      hoaChanged = true;
    }
    if (
      existingHoa[
        'feeFrequency'
      ] !== undefined
    ) {
      updates['hoa.feeFrequency'] =
        FieldValue.delete();
      hoaChanged = true;
    }
  }
  if (hoaChanged) {
    updatedFields.push(
      'hoa'
    );
  }
}
function readRequiredString(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} is required.`
    );
  }
  return value.trim();
}
function readRequiredNumber(
  value: unknown,
  fieldName: string
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    throw new HttpsError(
      'failed-precondition',
      `${fieldName} is invalid.`
    );
  }
  return value;
}
function readNumberWithinRange(
  value: unknown,
  fieldName: string,
  minimum: number,
  maximum: number
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  ) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} must be between ${minimum} and ${maximum}.`
    );
  }
  return value;
}
function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}
