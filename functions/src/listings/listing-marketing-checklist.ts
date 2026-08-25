import {
  FieldValue
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

interface GetMarketingChecklistRequest {
  listingUid: string;
}

interface UpdateMarketingChecklistRequest {
  listingUid: string;
  completedItems: string[];
}

interface MarketingChecklistResult {
  listingUid: string;
  completedItems: string[];
}

const ALLOWED_CHECKLIST_ITEMS = [
  'copy-listing-link',
  'prepare-social-caption',
  'share-on-social-media',
  'email-potential-buyers',
  'download-qr-code',
  'add-qr-code-to-sign',
  'share-with-personal-network',
  'review-listing-accuracy'
] as const;

export const getListingMarketingChecklist =
  onCall<
    GetMarketingChecklistRequest,
    Promise<MarketingChecklistResult>
  >(
    callableFunctionOptions,
    async request => {
      const sellerUid =
        requireSellerUid(
          request.auth?.uid
        );

      const listingUid =
        requireListingUid(
          request.data?.listingUid
        );

      await verifyListingOwnership(
        listingUid,
        sellerUid
      );

      const marketingSnapshot =
        await adminFirestore
          .collection(
            'listingMarketingLinks'
          )
          .doc(listingUid)
          .get();

      const completedItems =
        normalizeCompletedItems(
          marketingSnapshot.get(
            'completedChecklistItems'
          )
        );

      return {
        listingUid,
        completedItems
      };
    }
  );

export const updateListingMarketingChecklist =
  onCall<
    UpdateMarketingChecklistRequest,
    Promise<MarketingChecklistResult>
  >(
    callableFunctionOptions,
    async request => {
      const sellerUid =
        requireSellerUid(
          request.auth?.uid
        );

      const listingUid =
        requireListingUid(
          request.data?.listingUid
        );

      const completedItems =
        normalizeCompletedItems(
          request.data?.completedItems
        );

      const listingReference =
        adminFirestore
          .collection('listings')
          .doc(listingUid);

      const marketingReference =
        adminFirestore
          .collection(
            'listingMarketingLinks'
          )
          .doc(listingUid);

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

          if (
            listingSnapshot.get(
              'sellerUid'
            ) !== sellerUid
          ) {
            throw new HttpsError(
              'permission-denied',
              'You do not have permission to update this marketing checklist.'
            );
          }

          const marketingSnapshot =
            await transaction.get(
              marketingReference
            );

          if (!marketingSnapshot.exists) {
            throw new HttpsError(
              'failed-precondition',
              'The listing marketing link must be created before updating its checklist.'
            );
          }

          transaction.update(
            marketingReference,
            {
              completedChecklistItems:
                completedItems,

              checklistUpdatedAt:
                FieldValue.serverTimestamp(),

              updatedAt:
                FieldValue.serverTimestamp()
            }
          );
        }
      );

      return {
        listingUid,
        completedItems
      };
    }
  );

async function verifyListingOwnership(
  listingUid: string,
  sellerUid: string
): Promise<void> {
  const listingSnapshot =
    await adminFirestore
      .collection('listings')
      .doc(listingUid)
      .get();

  if (!listingSnapshot.exists) {
    throw new HttpsError(
      'not-found',
      'The selected listing could not be found.'
    );
  }

  if (
    listingSnapshot.get('sellerUid') !==
    sellerUid
  ) {
    throw new HttpsError(
      'permission-denied',
      'You do not have permission to access this marketing checklist.'
    );
  }
}

function requireSellerUid(
  value: string | undefined
): string {
  if (!value) {
    throw new HttpsError(
      'unauthenticated',
      'You must be signed in to access a marketing checklist.'
    );
  }

  return value;
}

function requireListingUid(
  value: unknown
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The listing could not be identified.'
    );
  }

  return value.trim();
}

function normalizeCompletedItems(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedItems =
    new Set<string>(
      ALLOWED_CHECKLIST_ITEMS
    );

  return [
    ...new Set(
      value.filter(
        (item): item is string =>
          typeof item === 'string' &&
          allowedItems.has(item)
      )
    )
  ];
}