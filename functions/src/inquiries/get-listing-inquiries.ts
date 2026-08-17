import * as logger from 'firebase-functions/logger';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  Timestamp,
} from 'firebase-admin/firestore';

import {
  callableFunctionOptions,
} from '../shared/function-options';

import {
  adminFirestore,
} from '../shared/firebase-admin';

interface GetListingInquiriesData {
  listingUid: string;
}

interface ListingInquiryResponse {
  inquiryUid: string;
  inquiryReferenceNumber: string;

  listingUid: string;
  sellerUid: string;
  buyerUid: string;

  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;

  message: string;
  status: 'new' | 'read';
  isRead: boolean;

  propertyAddress: string;
  primaryPhotoUrl: string | null;

  createdAt: string;
  updatedAt: string;
  readAt: string | null;
}

interface GetListingInquiriesResponse {
  inquiries: ListingInquiryResponse[];
  unreadCount: number;
}

/**
 * Returns inquiries for one listing after confirming
 * the authenticated user owns that listing.
 */
export const getListingInquiries = onCall<
  GetListingInquiriesData,
  Promise<GetListingInquiriesResponse>
>(
  {
    ...callableFunctionOptions,
  },

  async request => {
    const sellerUid =
      request.auth?.uid;

    if (!sellerUid) {
      throw new HttpsError(
        'unauthenticated',
        'Sign in before reviewing buyer inquiries.',
      );
    }

    const listingUid =
      validateListingUid(
        request.data,
      );

    const listingReference =
      adminFirestore
        .collection('listings')
        .doc(listingUid);

    try {
      const listingSnapshot =
        await listingReference.get();

      if (!listingSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'The selected listing could not be found.',
        );
      }

      const listingData =
        listingSnapshot.data();

      const listingSellerUid =
        readString(
          listingData?.[
            'sellerUid'
          ],
        );

      if (
        !listingSellerUid ||
        listingSellerUid !== sellerUid
      ) {
        throw new HttpsError(
          'permission-denied',
          'You do not have permission to review inquiries for this listing.',
        );
      }

      const inquirySnapshot =
        await adminFirestore
          .collection(
            'listingInquiries',
          )
          .where(
            'listingUid',
            '==',
            listingUid,
          )
          .get();

      const inquiries =
        inquirySnapshot.docs
          .map(document =>
            createInquiryResponse(
              document.id,
              document.data(),
            )
          )
          .filter(
            inquiry =>
              inquiry.sellerUid ===
              sellerUid
          )
          .sort(
            (
              firstInquiry,
              secondInquiry,
            ) =>
              Date.parse(
                secondInquiry.createdAt,
              ) -
              Date.parse(
                firstInquiry.createdAt,
              )
          );

      const unreadCount =
        inquiries.filter(
          inquiry =>
            !inquiry.isRead
        ).length;

      logger.info(
        'Listing inquiries loaded.',
        {
          listingUid,
          sellerUid,
          inquiryCount:
            inquiries.length,
          unreadCount,
        },
      );

      return {
        inquiries,
        unreadCount,
      };
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }

      logger.error(
        'Unable to load listing inquiries.',
        {
          error,
          listingUid,
          sellerUid,
        },
      );

      throw new HttpsError(
        'internal',
        'We could not load buyer inquiries. Please try again.',
      );
    }
  },
);

function validateListingUid(
  value: unknown,
): string {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'A listing UID is required.',
    );
  }

  const listingUid =
    readString(
      value['listingUid'],
    );

  if (
    !listingUid ||
    listingUid.length > 128
  ) {
    throw new HttpsError(
      'invalid-argument',
      'A valid listing UID is required.',
    );
  }

  return listingUid;
}

function createInquiryResponse(
  documentUid: string,
  data:
    FirebaseFirestore.DocumentData,
): ListingInquiryResponse {
  const status =
    data['status'] === 'read'
      ? 'read'
      : 'new';

  return {
    inquiryUid:
      readString(
        data['inquiryUid'],
      ) ||
      documentUid,

    inquiryReferenceNumber:
      readString(
        data[
          'inquiryReferenceNumber'
        ],
      ),

    listingUid:
      readString(
        data['listingUid'],
      ),

    sellerUid:
      readString(
        data['sellerUid'],
      ),

    buyerUid:
      readString(
        data['buyerUid'],
      ),

    buyerName:
      readString(
        data['buyerName'],
      ),

    buyerEmail:
      readString(
        data['buyerEmail'],
      ),

    buyerPhone:
      readString(
        data['buyerPhone'],
      ),

    message:
      readString(
        data['message'],
      ),

    status,

    isRead:
      data['isRead'] === true,

    propertyAddress:
      readString(
        data['propertyAddress'],
      ),

    primaryPhotoUrl:
      readNullableString(
        data['primaryPhotoUrl'],
      ),

    createdAt:
      toIsoString(
        data['createdAt'],
      ),

    updatedAt:
      toIsoString(
        data['updatedAt'],
      ),

    readAt:
      toNullableIsoString(
        data['readAt'],
      ),
  };
}

function toIsoString(
  value: unknown,
): string {
  if (value instanceof Timestamp) {
    return value
      .toDate()
      .toISOString();
  }

  return new Date(0).toISOString();
}

function toNullableIsoString(
  value: unknown,
): string | null {
  if (value instanceof Timestamp) {
    return value
      .toDate()
      .toISOString();
  }

  return null;
}

function readNullableString(
  value: unknown,
): string | null {
  const normalizedValue =
    readString(value);

  return normalizedValue || null;
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