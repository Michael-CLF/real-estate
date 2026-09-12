import * as logger from 'firebase-functions/logger';

import {
  DocumentData,
  DocumentSnapshot,
  Timestamp
} from 'firebase-admin/firestore';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  adminFirestore
} from '../shared/firebase-admin';

import {
  callableFunctionOptions
} from '../shared/function-options';


type AdministrationListingRecordType =
  | 'draft'
  | 'published';


interface GetAdministrationListingDetailsData {
  listingUid: string;

  recordType:
    AdministrationListingRecordType;
}


interface AdministrationListingRelatedSummary {
  offerCount: number;
  inquiryCount: number;
  showingRequestCount: number;
  viewSessionCount: number;
  disclosureCount: number;

  savedCount: number;
  viewCount: number;

  hasMarketingLink: boolean;
  marketingShareCode: string | null;
  marketingShortPath: string | null;

  hasTransaction: boolean;
}


interface GetAdministrationListingDetailsResponse {
  requestedListingUid: string;

  recordType:
    AdministrationListingRecordType;

  sellerUid: string;

  publishedListingUid:
    string | null;

  sourceDraftUid:
    string | null;

  publishedListing:
    Record<string, unknown> |
    null;

  sourceDraft:
    Record<string, unknown> |
    null;

  related:
    AdministrationListingRelatedSummary;
}


export const getAdministrationListingDetails =
  onCall<
    GetAdministrationListingDetailsData,
    Promise<GetAdministrationListingDetailsResponse>
  >(
    {
      ...callableFunctionOptions
    },

    async request => {
      requireAdministrator(
        request.auth?.token
      );

      const input =
        validateRequestData(
          request.data
        );

      try {
        const records =
          input.recordType ===
            'published'
            ? await loadPublishedRecords(
                input.listingUid
              )
            : await loadDraftRecords(
                input.listingUid
              );

        const related =
          await loadRelatedSummary(
            records.publishedListingUid,
            records.publishedListing
          );

        return {
          requestedListingUid:
            input.listingUid,

          recordType:
            input.recordType,

          sellerUid:
            records.sellerUid,

          publishedListingUid:
            records.publishedListingUid,

          sourceDraftUid:
            records.sourceDraftUid,

          publishedListing:
            records.publishedListing
              ? serializeDocument(
                  records.publishedListing
                )
              : null,

          sourceDraft:
            records.sourceDraft
              ? serializeDocument(
                  records.sourceDraft
                )
              : null,

          related
        };
      } catch (error: unknown) {
        if (error instanceof HttpsError) {
          throw error;
        }

        logger.error(
          'Unable to load administrator listing details.',
          {
            listingUid:
              input.listingUid,

            recordType:
              input.recordType,

            error
          }
        );

        throw new HttpsError(
          'internal',
          'The listing details could not be loaded.'
        );
      }
    }
  );


interface LoadedListingRecords {
  sellerUid: string;

  publishedListingUid:
    string | null;

  sourceDraftUid:
    string | null;

  publishedListing:
    DocumentData |
    null;

  sourceDraft:
    DocumentData |
    null;
}


async function loadPublishedRecords(
  listingUid: string
): Promise<LoadedListingRecords> {
  const publishedReference =
    adminFirestore
      .collection('listings')
      .doc(listingUid);

  const [
    publishedSnapshot,
    sourceDraftSnapshot
  ] = await Promise.all([
    publishedReference.get(),

    adminFirestore
      .collection('listingDrafts')
      .where(
        'publication.publishedListingUid',
        '==',
        listingUid
      )
      .limit(1)
      .get()
  ]);

  if (!publishedSnapshot.exists) {
    throw new HttpsError(
      'not-found',
      'The selected published listing could not be found.'
    );
  }

  const publishedListing =
    requireDocumentData(
      publishedSnapshot,
      'The published listing contains no data.'
    );

  const sellerUid =
    requireSellerUid(
      publishedListing
    );

  const sourceDraftDocument =
    sourceDraftSnapshot.docs[0] ??
    null;

  const sourceDraft =
    sourceDraftDocument?.data() ??
    null;

  if (sourceDraft) {
    verifyMatchingSeller(
      sellerUid,
      sourceDraft
    );
  }

  return {
    sellerUid,

    publishedListingUid:
      listingUid,

    sourceDraftUid:
      sourceDraftDocument?.id ??
      null,

    publishedListing,

    sourceDraft
  };
}


async function loadDraftRecords(
  draftUid: string
): Promise<LoadedListingRecords> {
  const draftReference =
    adminFirestore
      .collection('listingDrafts')
      .doc(draftUid);

  const draftSnapshot =
    await draftReference.get();

  if (!draftSnapshot.exists) {
    throw new HttpsError(
      'not-found',
      'The selected listing draft could not be found.'
    );
  }

  const sourceDraft =
    requireDocumentData(
      draftSnapshot,
      'The listing draft contains no data.'
    );

  const sellerUid =
    requireSellerUid(
      sourceDraft
    );

  const publishedListingUid =
    readPublishedListingUid(
      sourceDraft
    );

  if (!publishedListingUid) {
    return {
      sellerUid,

      publishedListingUid:
        null,

      sourceDraftUid:
        draftUid,

      publishedListing:
        null,

      sourceDraft
    };
  }

  const publishedSnapshot =
    await adminFirestore
      .collection('listings')
      .doc(publishedListingUid)
      .get();

  const publishedListing =
    publishedSnapshot.exists
      ? publishedSnapshot.data() ??
        null
      : null;

  if (publishedListing) {
    verifyMatchingSeller(
      sellerUid,
      publishedListing
    );
  }

  return {
    sellerUid,

    publishedListingUid,

    sourceDraftUid:
      draftUid,

    publishedListing,

    sourceDraft
  };
}


async function loadRelatedSummary(
  publishedListingUid: string | null,
  publishedListing:
    DocumentData |
    null
): Promise<AdministrationListingRelatedSummary> {
  if (!publishedListingUid) {
    return {
      offerCount: 0,
      inquiryCount: 0,
      showingRequestCount: 0,
      viewSessionCount: 0,
      disclosureCount: 0,
      savedCount: 0,
      viewCount: 0,
      hasMarketingLink: false,
      marketingShareCode: null,
      marketingShortPath: null,
      hasTransaction: false
    };
  }

  const [
    offerSnapshot,
    inquirySnapshot,
    showingSnapshot,
    viewSnapshot,
    disclosureSnapshot,
    marketingSnapshot,
    transactionSnapshot
  ] = await Promise.all([
       adminFirestore
      .collection('offers')
      .where(
        'listingUid',
        '==',
        publishedListingUid
      )
      .get(),

    adminFirestore
      .collection(
        'listingInquiries'
      )
      .where(
        'listingUid',
        '==',
        publishedListingUid
      )
      .get(),

    adminFirestore
      .collection(
        'showingRequests'
      )
      .where(
        'listingUid',
        '==',
        publishedListingUid
      )
      .get(),

    adminFirestore
      .collection(
        'listingViewSessions'
      )
      .where(
        'listingUid',
        '==',
        publishedListingUid
      )
      .get(),

    adminFirestore
      .collection('listings')
      .doc(publishedListingUid)
      .collection('disclosures')
      .get(),

    adminFirestore
      .collection(
        'listingMarketingLinks'
      )
      .doc(publishedListingUid)
      .get(),

    adminFirestore
      .collection(
        'listingTransactions'
      )
      .doc(publishedListingUid)
      .get()
  ]);

  const marketingData =
    marketingSnapshot.data();

  return {
    offerCount:
      offerSnapshot.size,

    inquiryCount:
      inquirySnapshot.size,

    showingRequestCount:
      showingSnapshot.size,

    viewSessionCount:
      viewSnapshot.size,

    disclosureCount:
      disclosureSnapshot.size,

    savedCount:
      readNonNegativeNumber(
        publishedListing?.[
          'favorites'
        ] ??
        publishedListing?.[
          'favoriteCount'
        ]
      ),

    viewCount:
      readNonNegativeNumber(
        publishedListing?.[
          'views'
        ] ??
        publishedListing?.[
          'viewCount'
        ]
      ),

    hasMarketingLink:
      marketingSnapshot.exists,

    marketingShareCode:
      readString(
        marketingData?.[
          'shareCode'
        ]
      ) || null,

    marketingShortPath:
      readString(
        marketingData?.[
          'shortPath'
        ]
      ) || null,

    hasTransaction:
      transactionSnapshot.exists
  };
}


function validateRequestData(
  value: unknown
): GetAdministrationListingDetailsData {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'Listing details are required.'
    );
  }

  const listingUid =
    readString(
      value['listingUid']
    );

  if (
    !listingUid ||
    listingUid.length > 160 ||
    !/^[A-Za-z0-9_-]+$/.test(
      listingUid
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'A valid listing UID is required.'
    );
  }

  const recordType =
    value['recordType'];

  if (
    recordType !== 'draft' &&
    recordType !== 'published'
  ) {
    throw new HttpsError(
      'invalid-argument',
      'A valid listing record type is required.'
    );
  }

  return {
    listingUid,
    recordType
  };
}


function requireDocumentData(
  snapshot:
    DocumentSnapshot<DocumentData>,
  message: string
): DocumentData {
  const data =
    snapshot.data();

  if (!data) {
    throw new HttpsError(
      'data-loss',
      message
    );
  }

  return data;
}


function requireSellerUid(
  data: DocumentData
): string {
  const sellerUid =
    readString(
      data['sellerUid']
    );

  if (!sellerUid) {
    throw new HttpsError(
      'data-loss',
      'The selected listing does not identify its seller.'
    );
  }

  return sellerUid;
}


function verifyMatchingSeller(
  expectedSellerUid: string,
  data: DocumentData
): void {
  const sellerUid =
    requireSellerUid(data);

  if (
    sellerUid !==
    expectedSellerUid
  ) {
    throw new HttpsError(
      'data-loss',
      'The linked draft and published listing have different owners.'
    );
  }
}


function readPublishedListingUid(
  draftData: DocumentData
): string {
  const publication =
    draftData['publication'];

  if (!isRecord(publication)) {
    return '';
  }

  return readString(
    publication[
      'publishedListingUid'
    ]
  );
}


function serializeDocument(
  data: DocumentData
): Record<string, unknown> {
  const serializedValue =
    serializeFirestoreValue(data);

  return isRecord(serializedValue)
    ? serializedValue
    : {};
}


function serializeFirestoreValue(
  value: unknown
): unknown {
  if (value instanceof Timestamp) {
    return value
      .toDate()
      .toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(
      item =>
        serializeFirestoreValue(
          item
        )
    );
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, item]) => [
          key,
          serializeFirestoreValue(
            item
          )
        ]
      )
    );
  }

  return value;
}


function readNonNegativeNumber(
  value: unknown
): number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0
  )
    ? value
    : 0;
}


function readString(
  value: unknown
): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
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


function requireAdministrator(
  token:
    | Record<string, unknown>
    | undefined
): void {
  if (!token) {
    throw new HttpsError(
      'unauthenticated',
      'You must be signed in to access administration.'
    );
  }

  const isAdministrator =
    token['admin'] === true ||
    token['role'] === 'admin';

  if (!isAdministrator) {
    throw new HttpsError(
      'permission-denied',
      'Administrator access is required.'
    );
  }
}