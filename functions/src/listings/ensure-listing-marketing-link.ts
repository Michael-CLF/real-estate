import {
  randomBytes
} from 'node:crypto';

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

interface EnsureListingMarketingLinkRequest {
  listingUid: string;
}

interface EnsureListingMarketingLinkResult {
  listingUid: string;
  shareCode: string;
  shortPath: string;
}

interface ListingMarketingLinkDocument {
  listingUid?: string;
  sellerUid?: string;
  shareCode?: string;
  shortPath?: string;
}

const MARKETING_LINK_COLLECTION =
  'listingMarketingLinks';

const SHARE_CODE_COLLECTION =
  'listingShareCodes';

export const ensureListingMarketingLink =
  onCall<
    EnsureListingMarketingLinkRequest,
    Promise<EnsureListingMarketingLinkResult>
  >(
    callableFunctionOptions,
    async request => {
      const sellerUid =
        request.auth?.uid;

      if (!sellerUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must be signed in to create a listing marketing link.'
        );
      }

      const listingUid =
        readRequiredString(
          request.data?.listingUid,
          'The listing could not be identified.'
        );

      const listingReference =
        adminFirestore
          .collection('listings')
          .doc(listingUid);

      const marketingLinkReference =
        adminFirestore
          .collection(
            MARKETING_LINK_COLLECTION
          )
          .doc(listingUid);

      for (
        let attempt = 0;
        attempt < 10;
        attempt += 1
      ) {
        const shareCode =
          createShareCode();

        const shareCodeReference =
          adminFirestore
            .collection(
              SHARE_CODE_COLLECTION
            )
            .doc(shareCode);

        try {
          return await adminFirestore
            .runTransaction(
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

                const listing =
                  listingSnapshot.data();

                if (
                  listing?.['sellerUid'] !==
                  sellerUid
                ) {
                  throw new HttpsError(
                    'permission-denied',
                    'You do not have permission to market this listing.'
                  );
                }

                if (
                  listing?.['status'] !==
                  'active'
                ) {
                  throw new HttpsError(
                    'failed-precondition',
                    'Only active public listings can use marketing links.'
                  );
                }

                const existingLinkSnapshot =
                  await transaction.get(
                    marketingLinkReference
                  );

                if (
                  existingLinkSnapshot.exists
                ) {
                  const existingLink =
                    existingLinkSnapshot.data() as
                      ListingMarketingLinkDocument;

                  const existingShareCode =
                    existingLink.shareCode
                      ?.trim();

                  if (!existingShareCode) {
                    throw new HttpsError(
                      'failed-precondition',
                      'The existing listing marketing link is incomplete.'
                    );
                  }

                  return {
                    listingUid,
                    shareCode:
                      existingShareCode,
                    shortPath:
                      `/h/${existingShareCode}`
                  };
                }

                const shareCodeSnapshot =
                  await transaction.get(
                    shareCodeReference
                  );

                if (shareCodeSnapshot.exists) {
                  throw new ShareCodeCollisionError();
                }

                const shortPath =
                  `/h/${shareCode}`;

                transaction.create(
                  shareCodeReference,
                  {
                    listingUid,
                    sellerUid,
                    shareCode,
                    active: true,
                    createdAt:
                      FieldValue.serverTimestamp(),
                    updatedAt:
                      FieldValue.serverTimestamp()
                  }
                );

                transaction.create(
                  marketingLinkReference,
                  {
                    listingUid,
                    sellerUid,
                    shareCode,
                    shortPath,
                    createdAt:
                      FieldValue.serverTimestamp(),
                    updatedAt:
                      FieldValue.serverTimestamp()
                  }
                );

                return {
                  listingUid,
                  shareCode,
                  shortPath
                };
              }
            );
        } catch (error: unknown) {
          if (
            error instanceof
              ShareCodeCollisionError
          ) {
            continue;
          }

          if (error instanceof HttpsError) {
            throw error;
          }

          console.error(
            'Unable to create listing marketing link:',
            error
          );

          throw new HttpsError(
            'internal',
            'The listing marketing link could not be created.'
          );
        }
      }

      throw new HttpsError(
        'resource-exhausted',
        'A unique listing marketing link could not be generated.'
      );
    }
  );

class ShareCodeCollisionError extends Error {
  constructor() {
    super(
      'The generated listing share code is already assigned.'
    );

    this.name =
      'ShareCodeCollisionError';
  }
}

function createShareCode(): string {
  return randomBytes(6)
    .toString('base64url')
    .slice(0, 8)
    .toLowerCase();
}

function readRequiredString(
  value: unknown,
  message: string
): string {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new HttpsError(
      'invalid-argument',
      message
    );
  }

  return value.trim();
}