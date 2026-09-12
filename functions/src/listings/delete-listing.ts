import * as logger from 'firebase-functions/logger';

import {
  DocumentData,
  DocumentReference,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp
} from 'firebase-admin/firestore';

import {
  getStorage
} from 'firebase-admin/storage';

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


type ListingRecordType =
  | 'draft'
  | 'published';


interface DeleteListingData {
  listingUid: string;
  recordType: ListingRecordType;
}


interface DeleteListingResponse {
  success: true;

  requestedListingUid: string;
  recordType: ListingRecordType;

  deletedPublishedListings: number;
  deletedDrafts: number;
  deletedOffers: number;
  deletedContracts: number;
  deletedSavedListings: number;
  deletedInquiries: number;
  deletedInquiryRateLimits: number;
  deletedShowingRequests: number;
  deletedViewSessions: number;
  deletedMarketingLinks: number;
  deletedShareCodes: number;
  deletedShowingAvailability: number;
  deletedShowingSchedules: number;
  deletedTransactions: number;
  deletedStorageFiles: number;
}


interface DeletionContext {
  requestedListingUid: string;
  requestedRecordType: ListingRecordType;

  sellerUid: string;

  publishedListingUid: string | null;

  publishedListingReference:
    DocumentReference<DocumentData> |
    null;

  publishedListingData:
    DocumentData |
    null;

  draftDocuments:
    DocumentSnapshot<DocumentData>[];
}

interface DeletionCounts {
  deletedPublishedListings: number;
  deletedDrafts: number;
  deletedOffers: number;
  deletedContracts: number;
  deletedSavedListings: number;
  deletedInquiries: number;
  deletedInquiryRateLimits: number;
  deletedShowingRequests: number;
  deletedViewSessions: number;
  deletedMarketingLinks: number;
  deletedShareCodes: number;
  deletedShowingAvailability: number;
  deletedShowingSchedules: number;
  deletedTransactions: number;
  deletedStorageFiles: number;
}


const PROTECTED_OWNER_STATUSES =
  new Set([
    'under_contract',
    'under-contract',
    'sold'
  ]);


const QUERY_DELETE_BATCH_SIZE =
  200;


const USER_REFERENCE_BATCH_SIZE =
  100;


/**
 * Permanently deletes a listing or listing draft and
 * every NavStreet record or Storage object owned by it.
 *
 * Owners may delete their own ordinary listings and
 * drafts. Only administrators may permanently delete
 * under-contract or sold listings.
 */
export const deleteListing =
  onCall<
    DeleteListingData,
    Promise<DeleteListingResponse>
  >(
    {
      ...callableFunctionOptions,

      timeoutSeconds: 540,
      memory: '1GiB'
    },

    async request => {
      const authenticatedUserUid =
        request.auth?.uid;

      if (!authenticatedUserUid) {
        throw new HttpsError(
          'unauthenticated',
          'Sign in before deleting a listing.'
        );
      }

      const validatedInput =
        validateDeleteListingData(
          request.data
        );

      const administrator =
        isAdministrator(
          request.auth?.token
        );

      try {
        const context =
          await loadDeletionContext(
            validatedInput
          );

        verifyDeletionAccess(
          context,
          authenticatedUserUid,
          administrator
        );

        /*
         * Stop new inquiries, showings, offers, saves,
         * and views before cleanup begins.
         *
         * The published listing remains available for a
         * safe retry until every dependent record and
         * Storage object has been removed.
         */
        if (
          context.publishedListingReference
        ) {
          await context
            .publishedListingReference
            .update({
              status:
                'withdrawn',

              acceptingOffers:
                false,

              deletionStatus:
                'in_progress',

              deletionRequestedAt:
                Timestamp.now(),

              deletionRequestedByUid:
                authenticatedUserUid,

              updatedAt:
                Timestamp.now()
            });
        }

        const counts =
          await performDeletion(
            context
          );

        logger.info(
          'Listing permanently deleted.',
          {
            requestedListingUid:
              context.requestedListingUid,

            requestedRecordType:
              context.requestedRecordType,

            publishedListingUid:
              context.publishedListingUid,

            sellerUid:
              context.sellerUid,

            deletedByUid:
              authenticatedUserUid,

            administrator,

            counts
          }
        );

        return {
          success:
            true,

          requestedListingUid:
            context.requestedListingUid,

          recordType:
            context.requestedRecordType,

          ...counts
        };
      } catch (error: unknown) {
        if (error instanceof HttpsError) {
          throw error;
        }

        logger.error(
          'Unable to permanently delete listing.',
          {
            requestedListingUid:
              validatedInput.listingUid,

            requestedRecordType:
              validatedInput.recordType,

            authenticatedUserUid,

            administrator,

            error
          }
        );

        throw new HttpsError(
          'internal',
          'The listing could not be completely deleted. Please try again.'
        );
      }
    }
  );


async function loadDeletionContext(
  input: DeleteListingData
): Promise<DeletionContext> {
  if (input.recordType === 'published') {
    return loadPublishedListingContext(
      input
    );
  }

  return loadDraftContext(
    input
  );
}


async function loadPublishedListingContext(
  input: DeleteListingData
): Promise<DeletionContext> {
  const publishedListingReference =
    adminFirestore
      .collection('listings')
      .doc(input.listingUid);

  const publishedListingSnapshot =
    await publishedListingReference.get();

  if (!publishedListingSnapshot.exists) {
    throw new HttpsError(
      'not-found',
      'The selected published listing could not be found.'
    );
  }

  const publishedListingData =
    publishedListingSnapshot.data();

  if (!publishedListingData) {
    throw new HttpsError(
      'data-loss',
      'The selected published listing contains no data.'
    );
  }

  const sellerUid =
    readRequiredSellerUid(
      publishedListingData
    );

  const linkedDraftSnapshot =
    await adminFirestore
      .collection('listingDrafts')
      .where(
        'publication.publishedListingUid',
        '==',
        input.listingUid
      )
      .get();

  verifyLinkedDraftOwnership(
    linkedDraftSnapshot.docs,
    sellerUid
  );

  return {
    requestedListingUid:
      input.listingUid,

    requestedRecordType:
      input.recordType,

    sellerUid,

    publishedListingUid:
      input.listingUid,

    publishedListingReference,

    publishedListingData,

    draftDocuments:
      linkedDraftSnapshot.docs
  };
}


async function loadDraftContext(
  input: DeleteListingData
): Promise<DeletionContext> {
  const draftReference =
    adminFirestore
      .collection('listingDrafts')
      .doc(input.listingUid);

  const draftSnapshot =
    await draftReference.get();

  if (!draftSnapshot.exists) {
    throw new HttpsError(
      'not-found',
      'The selected listing draft could not be found.'
    );
  }

  const draftData =
    draftSnapshot.data();

  if (!draftData) {
    throw new HttpsError(
      'data-loss',
      'The selected listing draft contains no data.'
    );
  }

  const sellerUid =
    readRequiredSellerUid(
      draftData
    );

  const publishedListingUid =
    readPublishedListingUid(
      draftData
    );

  if (!publishedListingUid) {
    return {
      requestedListingUid:
        input.listingUid,

      requestedRecordType:
        input.recordType,

      sellerUid,

      publishedListingUid:
        null,

      publishedListingReference:
        null,

      publishedListingData:
        null,

      draftDocuments: [
        draftSnapshot
      ]
    };
  }

  const publishedListingReference =
    adminFirestore
      .collection('listings')
      .doc(publishedListingUid);

  const publishedListingSnapshot =
    await publishedListingReference.get();

  const publishedListingData =
    publishedListingSnapshot.exists
      ? publishedListingSnapshot.data() ??
        null
      : null;

  if (publishedListingData) {
    const publishedSellerUid =
      readRequiredSellerUid(
        publishedListingData
      );

    if (publishedSellerUid !== sellerUid) {
      throw new HttpsError(
        'data-loss',
        'The listing draft and published listing have different owners.'
      );
    }
  }

  const linkedDraftSnapshot =
    await adminFirestore
      .collection('listingDrafts')
      .where(
        'publication.publishedListingUid',
        '==',
        publishedListingUid
      )
      .get();

  const draftDocuments =
    mergeDraftDocuments(
      [
        draftSnapshot,
        ...linkedDraftSnapshot.docs
      ]
    );

  verifyLinkedDraftOwnership(
    draftDocuments,
    sellerUid
  );

  return {
    requestedListingUid:
      input.listingUid,

    requestedRecordType:
      input.recordType,

    sellerUid,

    publishedListingUid,

    publishedListingReference:
      publishedListingSnapshot.exists
        ? publishedListingReference
        : null,

    publishedListingData,

    draftDocuments
  };
}


function verifyDeletionAccess(
  context: DeletionContext,
  authenticatedUserUid: string,
  administrator: boolean
): void {
  if (administrator) {
    return;
  }

  if (
    context.sellerUid !==
    authenticatedUserUid
  ) {
    throw new HttpsError(
      'permission-denied',
      'Only the listing owner may delete this listing.'
    );
  }

  const publishedStatus =
    readString(
      context.publishedListingData?.[
        'status'
      ]
    )
      .toLowerCase();

  if (
    PROTECTED_OWNER_STATUSES.has(
      publishedStatus
    )
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Under-contract and sold listings can only be permanently deleted by an administrator.'
    );
  }
}


async function performDeletion(
  context: DeletionContext
): Promise<DeletionCounts> {
  const counts:
    DeletionCounts = {
      deletedPublishedListings: 0,
      deletedDrafts: 0,
      deletedOffers: 0,
      deletedContracts: 0,
      deletedSavedListings: 0,
      deletedInquiries: 0,
      deletedInquiryRateLimits: 0,
      deletedShowingRequests: 0,
      deletedViewSessions: 0,
      deletedMarketingLinks: 0,
      deletedShareCodes: 0,
      deletedShowingAvailability: 0,
      deletedShowingSchedules: 0,
      deletedTransactions: 0,
      deletedStorageFiles: 0
    };

  const relatedListingUids =
    createRelatedListingUids(
      context
    );

  const offerDocuments =
    await getRelatedOfferDocuments(
      relatedListingUids
    );

  const marketingLinkDocuments =
    await getMarketingLinkDocuments(
      relatedListingUids
    );

  const shareCodeDocuments =
    await getShareCodeDocuments(
      relatedListingUids
    );

  const storagePrefixes =
    createStoragePrefixes(
      context,
      offerDocuments
    );

  /*
   * Delete Storage first while the Firestore records
   * containing the associated identities still exist.
   */
  counts.deletedStorageFiles =
    await deleteStoragePrefixes(
      storagePrefixes
    );

  /*
   * Delete independent query-based collections.
   */
  for (
    const listingUid of
    relatedListingUids
  ) {
    counts.deletedSavedListings +=
      await deleteSavedListingReferences(
        listingUid
      );

    counts.deletedInquiries +=
      await deleteMatchingDocuments(
        'listingInquiries',
        'listingUid',
        listingUid
      );

    counts.deletedInquiryRateLimits +=
      await deleteMatchingDocuments(
        'listingInquiryRateLimits',
        'listingUid',
        listingUid
      );

    counts.deletedShowingRequests +=
      await deleteMatchingDocuments(
        'showingRequests',
        'listingUid',
        listingUid
      );

    counts.deletedViewSessions +=
      await deleteMatchingDocuments(
        'listingViewSessions',
        'listingUid',
        listingUid
      );
  }

  /*
   * Delete offer contracts before removing their
   * parent offer records.
   */
  for (
    const offerDocument of
    offerDocuments
  ) {
    const contractReference =
      adminFirestore
        .collection('contracts')
        .doc(offerDocument.id);

    const contractSnapshot =
      await contractReference.get();

    if (contractSnapshot.exists) {
      await adminFirestore
        .recursiveDelete(
          contractReference
        );

      counts.deletedContracts += 1;
    }
  }

  for (
    const offerDocument of
    offerDocuments
  ) {
    await adminFirestore
      .recursiveDelete(
        offerDocument.ref
      );

    counts.deletedOffers += 1;
  }

  for (
    const shareCodeDocument of
    shareCodeDocuments
  ) {
    await adminFirestore
      .recursiveDelete(
        shareCodeDocument.ref
      );

    counts.deletedShareCodes += 1;
  }

  for (
    const marketingLinkDocument of
    marketingLinkDocuments
  ) {
    await adminFirestore
      .recursiveDelete(
        marketingLinkDocument.ref
      );

    counts.deletedMarketingLinks += 1;
  }

  /*
   * Delete deterministic listing-owned documents.
   * recursiveDelete also removes nested schedule dates.
   */
  for (
    const listingUid of
    relatedListingUids
  ) {
    counts.deletedShowingAvailability +=
      await deleteExistingDocumentTree(
        adminFirestore
          .collection(
            'showingAvailability'
          )
          .doc(listingUid)
      );

    counts.deletedShowingSchedules +=
      await deleteDocumentTree(
        adminFirestore
          .collection(
            'showingSchedules'
          )
          .doc(listingUid)
      );

    counts.deletedTransactions +=
      await deleteExistingDocumentTree(
        adminFirestore
          .collection(
            'listingTransactions'
          )
          .doc(listingUid)
      );

    /*
     * This direct deletion is intentionally retained
     * even when the marketing document query found
     * nothing. It also removes nested data beneath a
     * missing parent document.
     */
    await deleteDocumentTree(
      adminFirestore
        .collection(
          'listingMarketingLinks'
        )
        .doc(listingUid)
    );
  }

  /*
   * Delete linked drafts after every dependent record
   * and Storage object has been cleaned.
   */
  for (
    const draftDocument of
    context.draftDocuments
  ) {
    await adminFirestore
      .recursiveDelete(
        draftDocument.ref
      );

    counts.deletedDrafts += 1;
  }

  /*
   * Delete the published listing last. This removes
   * disclosures, disclosure versions, price history,
   * and any future listing subcollections.
   */
  if (
    context.publishedListingReference
  ) {
    await adminFirestore
      .recursiveDelete(
        context.publishedListingReference
      );

    counts.deletedPublishedListings =
      1;
  }

  return counts;
}


function createRelatedListingUids(
  context: DeletionContext
): string[] {
  const listingUids =
    new Set<string>();

  listingUids.add(
    context.requestedListingUid
  );

  if (
    context.publishedListingUid
  ) {
    listingUids.add(
      context.publishedListingUid
    );
  }

  return [
    ...listingUids
  ];
}


async function getRelatedOfferDocuments(
  listingUids: string[]
): Promise<
  QueryDocumentSnapshot<DocumentData>[]
> {
  const documentsByUid =
    new Map<
      string,
      QueryDocumentSnapshot<DocumentData>
    >();

  for (
    const listingUid of listingUids
  ) {
    const snapshot =
      await adminFirestore
        .collection('offers')
        .where(
          'listingUid',
          '==',
          listingUid
        )
        .get();

    snapshot.docs.forEach(
      documentSnapshot => {
        documentsByUid.set(
          documentSnapshot.id,
          documentSnapshot
        );
      }
    );
  }

  return [
    ...documentsByUid.values()
  ];
}


async function getMarketingLinkDocuments(
  listingUids: string[]
): Promise<
  DocumentSnapshot<DocumentData>[]
> {
  const documentsByUid =
    new Map<
      string,
      DocumentSnapshot<DocumentData>
    >();

  for (
    const listingUid of listingUids
  ) {
    const snapshot =
      await adminFirestore
        .collection(
          'listingMarketingLinks'
        )
        .where(
          'listingUid',
          '==',
          listingUid
        )
        .get();

    snapshot.docs.forEach(
      documentSnapshot => {
        documentsByUid.set(
          documentSnapshot.id,
          documentSnapshot
        );
      }
    );

    const directSnapshot =
      await adminFirestore
        .collection(
          'listingMarketingLinks'
        )
        .doc(listingUid)
        .get();

    if (directSnapshot.exists) {
      documentsByUid.set(
        directSnapshot.id,
        directSnapshot
      );
    }
  }

  return [
    ...documentsByUid.values()
  ];
}

async function getShareCodeDocuments(
  listingUids: string[]
): Promise<
  QueryDocumentSnapshot<DocumentData>[]
> {
  const documentsByUid =
    new Map<
      string,
      QueryDocumentSnapshot<DocumentData>
    >();

  for (
    const listingUid of listingUids
  ) {
    const snapshot =
      await adminFirestore
        .collection(
          'listingShareCodes'
        )
        .where(
          'listingUid',
          '==',
          listingUid
        )
        .get();

    snapshot.docs.forEach(
      documentSnapshot => {
        documentsByUid.set(
          documentSnapshot.id,
          documentSnapshot
        );
      }
    );
  }

  return [
    ...documentsByUid.values()
  ];
}


function createStoragePrefixes(
  context: DeletionContext,
  offerDocuments:
    QueryDocumentSnapshot<DocumentData>[]
): string[] {
  const prefixes =
    new Set<string>();

  /*
   * Listing photos are normally stored beneath the
   * original draft UID. Include both draft and
   * published UIDs for compatibility with older data.
   */
  prefixes.add(
    [
      'listing-images',
      context.sellerUid,
      context.requestedListingUid,
      ''
    ].join('/')
  );

  for (
    const draftDocument of
    context.draftDocuments
  ) {
    prefixes.add(
      [
        'listing-images',
        context.sellerUid,
        draftDocument.id,
        ''
      ].join('/')
    );
  }

  if (
    context.publishedListingUid
  ) {
    prefixes.add(
      [
        'listing-images',
        context.sellerUid,
        context.publishedListingUid,
        ''
      ].join('/')
    );

    prefixes.add(
      [
        'listing-disclosures',
        context.sellerUid,
        context.publishedListingUid,
        ''
      ].join('/')
    );
  }

  for (
    const offerDocument of
    offerDocuments
  ) {
    prefixes.add(
      [
        'offers',
        offerDocument.id,
        ''
      ].join('/')
    );
  }

  return [
    ...prefixes
  ];
}


async function deleteStoragePrefixes(
  prefixes: string[]
): Promise<number> {
  const bucket =
    getStorage().bucket();

  let deletedFileCount = 0;

  for (
    const prefix of prefixes
  ) {
    const [
      files
    ] = await bucket.getFiles({
      prefix
    });

    if (files.length === 0) {
      continue;
    }

    const deletionResults =
      await Promise.allSettled(
        files.map(
          file =>
            file.delete({
              ignoreNotFound:
                true
            })
        )
      );

    const failedDeletion =
      deletionResults.find(
        result =>
          result.status ===
          'rejected'
      );

    if (failedDeletion) {
      throw new Error(
        `One or more Storage files beneath ${prefix} could not be deleted.`
      );
    }

    deletedFileCount +=
      files.length;
  }

  return deletedFileCount;
}


async function deleteMatchingDocuments(
  collectionName: string,
  fieldName: string,
  fieldValue: string
): Promise<number> {
  let deletedDocumentCount = 0;

  while (true) {
    const snapshot =
      await adminFirestore
        .collection(collectionName)
        .where(
          fieldName,
          '==',
          fieldValue
        )
        .limit(
          QUERY_DELETE_BATCH_SIZE
        )
        .get();

    if (snapshot.empty) {
      break;
    }

    await Promise.all(
      snapshot.docs.map(
        documentSnapshot =>
          adminFirestore
            .recursiveDelete(
              documentSnapshot.ref
            )
      )
    );

    deletedDocumentCount +=
      snapshot.size;
  }

  return deletedDocumentCount;
}


/**
 * Saved listing documents are stored below individual
 * user documents. Inspecting the deterministic document
 * path avoids requiring a collection-group index.
 */
async function deleteSavedListingReferences(
  listingUid: string
): Promise<number> {
  const userReferences =
    await adminFirestore
      .collection('users')
      .listDocuments();

  let deletedDocumentCount = 0;

  for (
    let index = 0;
    index < userReferences.length;
    index += USER_REFERENCE_BATCH_SIZE
  ) {
    const userReferenceBatch =
      userReferences.slice(
        index,
        index +
        USER_REFERENCE_BATCH_SIZE
      );

    const savedListingReferences =
      userReferenceBatch.map(
        userReference =>
          userReference
            .collection(
              'savedListings'
            )
            .doc(listingUid)
      );

    if (
      savedListingReferences.length === 0
    ) {
      continue;
    }

    const savedListingSnapshots =
      await adminFirestore.getAll(
        ...savedListingReferences
      );

    const existingSnapshots =
      savedListingSnapshots.filter(
        snapshot =>
          snapshot.exists
      );

    await Promise.all(
      existingSnapshots.map(
        snapshot =>
          adminFirestore
            .recursiveDelete(
              snapshot.ref
            )
      )
    );

    deletedDocumentCount +=
      existingSnapshots.length;
  }

  return deletedDocumentCount;
}


async function deleteExistingDocumentTree(
  reference:
    DocumentReference<DocumentData>
): Promise<number> {
  const snapshot =
    await reference.get();

  if (!snapshot.exists) {
    return 0;
  }

  await adminFirestore
    .recursiveDelete(
      reference
    );

  return 1;
}


/**
 * recursiveDelete is deliberately called even when the
 * parent document does not exist because Firestore can
 * retain subcollections beneath a missing parent.
 */
async function deleteDocumentTree(
  reference:
    DocumentReference<DocumentData>
): Promise<number> {
  const snapshot =
    await reference.get();

  await adminFirestore
    .recursiveDelete(
      reference
    );

  return snapshot.exists
    ? 1
    : 0;
}


function mergeDraftDocuments(
  documents:
    DocumentSnapshot<DocumentData>[]
): DocumentSnapshot<DocumentData>[] {
  const documentsByUid =
    new Map<
      string,
      DocumentSnapshot<DocumentData>
    >();

  documents.forEach(
    documentSnapshot => {
      documentsByUid.set(
        documentSnapshot.id,
        documentSnapshot
      );
    }
  );

  return [
    ...documentsByUid.values()
  ];
}


function verifyLinkedDraftOwnership(
  draftDocuments:
    DocumentSnapshot<DocumentData>[],
  sellerUid: string
): void {
  const mismatchedDraft =
    draftDocuments.find(
      draftDocument =>
        readString(
          draftDocument.data()?.[
            'sellerUid'
          ]
        ) !== sellerUid
    );

  if (mismatchedDraft) {
    throw new HttpsError(
      'data-loss',
      'A linked listing draft has a different owner.'
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


function readRequiredSellerUid(
  data: DocumentData
): string {
  const sellerUid =
    readString(
      data['sellerUid']
    );

  if (!sellerUid) {
    throw new HttpsError(
      'data-loss',
      'The selected listing does not identify its owner.'
    );
  }

  return sellerUid;
}


function validateDeleteListingData(
  value: unknown
): DeleteListingData {
  if (!isRecord(value)) {
    throw new HttpsError(
      'invalid-argument',
      'Listing deletion information is required.'
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


function isAdministrator(
  token:
    | Record<string, unknown>
    | undefined
): boolean {
  return (
    token?.['admin'] === true ||
    token?.['role'] === 'admin'
  );
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