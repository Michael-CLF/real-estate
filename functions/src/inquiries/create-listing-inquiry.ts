import * as logger from 'firebase-functions/logger';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  FieldValue,
  Timestamp,
} from 'firebase-admin/firestore';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  adminAuth,
  adminFirestore,
} from '../shared/firebase-admin';

import {
  normalizeEmail,
} from '../shared/normalize-email';

interface CreateListingInquiryData {
  listingUid: string;
  message: string;
}

interface CreateListingInquiryResponse {
  inquiryUid: string;
  inquiryReferenceNumber: string;
}

const MINIMUM_MESSAGE_LENGTH = 20;
const MAXIMUM_MESSAGE_LENGTH = 2_000;

const MINIMUM_INQUIRY_INTERVAL_MS =
  30 * 1000;

/**
 * Creates a buyer inquiry for an active published
 * listing using trusted account and listing data.
 */
export const createListingInquiry = onCall<
  CreateListingInquiryData,
  Promise<CreateListingInquiryResponse>
>(
  {
    ...callableFunctionOptions,
  },

  async request => {
    const buyerUid =
      request.auth?.uid;

    if (!buyerUid) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in before contacting the seller.',
      );
    }

    const data =
      validateRequestData(
        request.data,
      );

    const buyerRecord =
      await adminAuth.getUser(
        buyerUid,
      );

    const buyerEmail =
      normalizeEmail(
        buyerRecord.email,
      );

    if (!buyerEmail) {
      throw new HttpsError(
        'failed-precondition',
        'Your NavStreet account does not have a verified email address.',
      );
    }

    const listingReference =
      adminFirestore
        .collection('listings')
        .doc(data.listingUid);

    const buyerProfileReference =
      adminFirestore
        .collection('users')
        .doc(buyerUid);

    const inquiryReference =
      adminFirestore
        .collection(
          'listingInquiries',
        )
        .doc();

    const rateLimitReference =
      adminFirestore
        .collection(
          'listingInquiryRateLimits',
        )
        .doc(
          createRateLimitDocumentUid(
            buyerUid,
            data.listingUid,
          ),
        );

    const inquiryReferenceNumber =
      createInquiryReferenceNumber(
        inquiryReference.id,
        Timestamp.now(),
      );

    try {
      await adminFirestore.runTransaction(
        async transaction => {
          /*
           * All reads occur before transactional writes.
           */
          const [
            listingSnapshot,
            buyerProfileSnapshot,
            rateLimitSnapshot,
          ] = await Promise.all([
            transaction.get(
              listingReference,
            ),

            transaction.get(
              buyerProfileReference,
            ),

            transaction.get(
              rateLimitReference,
            ),
          ]);

          if (!listingSnapshot.exists) {
            throw new HttpsError(
              'not-found',
              'The selected listing could not be found.',
            );
          }

          const listingData =
            listingSnapshot.data();

          if (!listingData) {
            throw new HttpsError(
              'not-found',
              'The selected listing contains no data.',
            );
          }

          if (
            listingData['status'] !==
            'active'
          ) {
            throw new HttpsError(
              'failed-precondition',
              'This listing is not currently accepting buyer inquiries.',
            );
          }

          const sellerUid =
            readString(
              listingData[
                'sellerUid'
              ],
            );

          if (!sellerUid) {
            throw new HttpsError(
              'failed-precondition',
              'The listing seller could not be identified.',
            );
          }

          if (sellerUid === buyerUid) {
            throw new HttpsError(
              'failed-precondition',
              'You cannot submit an inquiry about your own listing.',
            );
          }

          enforceRateLimit(
            rateLimitSnapshot.data(),
          );

          const buyerProfile =
            buyerProfileSnapshot.data();

          const buyerName =
            getBuyerName(
              buyerProfile,
              buyerRecord.displayName,
            );

          const buyerPhone =
            getBuyerPhone(
              buyerProfile,
            );

          if (!buyerName) {
            throw new HttpsError(
              'failed-precondition',
              'Your NavStreet account does not contain your name.',
            );
          }

          if (!buyerPhone) {
            throw new HttpsError(
              'failed-precondition',
              'Add a valid telephone number to your NavStreet account before contacting the seller.',
            );
          }

          const listingAddress =
            getListingAddress(
              listingData,
            );

          const primaryPhotoUrl =
            getPrimaryPhotoUrl(
              listingData,
            );

          transaction.create(
            inquiryReference,
            {
              inquiryUid:
                inquiryReference.id,

              inquiryReferenceNumber,

              listingUid:
                data.listingUid,

              sellerUid,
              buyerUid,

              buyerName,
              buyerEmail,
              buyerPhone,

              message:
                data.message,

              status: 'new',
              isRead: false,

              propertyAddress:
                listingAddress,

              primaryPhotoUrl,

              sellerNotification: {
                channel: 'email',
                status: 'pending',
                recipientEmail: '',
                sentAt: null,
                failedAt: null,
                failureMessage: '',
              },

              createdAt:
                FieldValue
                  .serverTimestamp(),

              updatedAt:
                FieldValue
                  .serverTimestamp(),

              readAt: null,
            },
          );

          transaction.update(
            listingReference,
            {
              inquiries:
                FieldValue.increment(1),

              lastInquiryAt:
                FieldValue
                  .serverTimestamp(),

              updatedAt:
                FieldValue
                  .serverTimestamp(),
            },
          );

          transaction.set(
            rateLimitReference,
            {
              buyerUid,

              listingUid:
                data.listingUid,

              lastInquiryAt:
                FieldValue
                  .serverTimestamp(),

              updatedAt:
                FieldValue
                  .serverTimestamp(),
            },
            {
              merge: true,
            },
          );
        },
      );
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        'Unable to create listing inquiry.',
        {
          error,
          listingUid:
            data.listingUid,
          buyerUid,
        },
      );

      throw new HttpsError(
        'internal',
        'We could not send your message to the seller. Please try again.',
      );
    }

    logger.info(
      'Listing inquiry created.',
      {
        inquiryUid:
          inquiryReference.id,

        inquiryReferenceNumber,

        listingUid:
          data.listingUid,

        buyerUid,
      },
    );

    return {
      inquiryUid:
        inquiryReference.id,

      inquiryReferenceNumber,
    };
  },
);

/**
 * Validates and normalizes callable request data.
 */
function validateRequestData(
  value: unknown,
): CreateListingInquiryData {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'Listing inquiry data is required.',
    );
  }

  const listingUid =
    requireString(
      value['listingUid'],
      'A listing UID is required.',
      128,
    );

  const message =
    requireString(
      value['message'],
      'Enter a message for the seller.',
      MAXIMUM_MESSAGE_LENGTH,
    );

  if (
    message.length <
    MINIMUM_MESSAGE_LENGTH
  ) {
    throw new HttpsError(
      'invalid-argument',
      `Your message must contain at least ${MINIMUM_MESSAGE_LENGTH} characters.`,
    );
  }

  return {
    listingUid,
    message,
  };
}

/**
 * Prevents rapid duplicate inquiry submissions from
 * the same buyer for the same listing.
 */
function enforceRateLimit(
  data:
    FirebaseFirestore.DocumentData |
    undefined,
): void {
  if (!data) {
    return;
  }

  const lastInquiryAt =
    data['lastInquiryAt'];

  if (
    !(lastInquiryAt instanceof Timestamp)
  ) {
    return;
  }

  const elapsedMilliseconds =
    Date.now() -
    lastInquiryAt.toMillis();

  if (
    elapsedMilliseconds <
    MINIMUM_INQUIRY_INTERVAL_MS
  ) {
    throw new HttpsError(
      'resource-exhausted',
      'Please wait a moment before sending another inquiry for this property.',
    );
  }
}

function createRateLimitDocumentUid(
  buyerUid: string,
  listingUid: string,
): string {
  return `${buyerUid}_${listingUid}`;
}

function createInquiryReferenceNumber(
  inquiryUid: string,
  createdAt: Timestamp,
): string {
  const date =
    createdAt.toDate();

  const datePortion = [
    date.getUTCFullYear(),

    (date.getUTCMonth() + 1)
      .toString()
      .padStart(2, '0'),

    date.getUTCDate()
      .toString()
      .padStart(2, '0'),
  ].join('');

  const uniquePortion =
    inquiryUid
      .replace(
        /[^a-zA-Z0-9]/g,
        '',
      )
      .slice(0, 6)
      .toUpperCase()
      .padEnd(6, 'X');

  return (
    `INQ-${datePortion}-` +
    uniquePortion
  );
}

function getBuyerName(
  profile:
    FirebaseFirestore.DocumentData |
    undefined,
  authenticationDisplayName:
    string | undefined,
): string {
  if (profile) {
    const firstName =
      readString(
        profile['firstName'],
      );

    const lastName =
      readString(
        profile['lastName'],
      );

    const fullName =
      [
        firstName,
        lastName,
      ]
        .filter(Boolean)
        .join(' ');

    if (fullName) {
      return fullName;
    }

    const displayName =
      readString(
        profile['displayName'],
      );

    if (displayName) {
      return displayName;
    }
  }

  return (
    authenticationDisplayName
      ?.trim() ?? ''
  );
}

function getBuyerPhone(
  profile:
    FirebaseFirestore.DocumentData |
    undefined,
): string {
  if (!profile) {
    return '';
  }

  const phone =
    readString(
      profile['phone'],
    );

  if (!phone) {
    return '';
  }

  return formatUsPhoneNumber(
    phone,
  );
}

function formatUsPhoneNumber(
  value: string,
): string {
  const digits =
    value.replace(/\D/g, '');

  const normalizedDigits =
    digits.length === 11 &&
    digits.startsWith('1')
      ? digits.slice(1)
      : digits;

  if (
    normalizedDigits.length !== 10
  ) {
    return '';
  }

  return (
    `(${normalizedDigits.slice(0, 3)}) ` +
    `${normalizedDigits.slice(3, 6)}-` +
    normalizedDigits.slice(6)
  );
}

function getListingAddress(
  listingData:
    FirebaseFirestore.DocumentData,
): string {
  const addressLine1 =
    readString(
      listingData[
        'addressLine1'
      ],
    );

  const addressLine2 =
    readString(
      listingData[
        'addressLine2'
      ],
    );

  const city =
    readString(
      listingData['city'],
    );

  const state =
    readString(
      listingData['state'],
    );

  const zipCode =
    readString(
      listingData['zipCode'],
    );

  const streetAddress =
    [
      addressLine1,
      addressLine2,
    ]
      .filter(Boolean)
      .join(', ');

  const cityStateZip =
    [
      city,
      state,
      zipCode,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    [
      streetAddress,
      cityStateZip,
    ]
      .filter(Boolean)
      .join(', ')
  );
}

function getPrimaryPhotoUrl(
  listingData:
    FirebaseFirestore.DocumentData,
): string | null {
  const primaryPhotoUrl =
    readString(
      listingData[
        'primaryPhotoUrl'
      ],
    );

  return primaryPhotoUrl || null;
}

function requireString(
  value: unknown,
  message: string,
  maximumLength: number,
): string {
  const normalizedValue =
    readString(value);

  if (!normalizedValue) {
    throw new HttpsError(
      'invalid-argument',
      message,
    );
  }

  if (
    normalizedValue.length >
    maximumLength
  ) {
    throw new HttpsError(
      'invalid-argument',
      message,
    );
  }

  return normalizedValue;
}

function readString(
  value: unknown,
): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}