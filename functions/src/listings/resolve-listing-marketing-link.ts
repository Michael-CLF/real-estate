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

interface ResolveListingMarketingLinkRequest {
  shareCode: string;
}

interface ResolveListingMarketingLinkResult {
  listingUid: string;
  listingPath: string;
}

export const resolveListingMarketingLink =
  onCall<
    ResolveListingMarketingLinkRequest,
    Promise<ResolveListingMarketingLinkResult>
  >(
    callableFunctionOptions,
    async request => {
      const shareCode =
        normalizeShareCode(
          request.data?.shareCode
        );

      const shareCodeSnapshot =
        await adminFirestore
          .collection('listingShareCodes')
          .doc(shareCode)
          .get();

      if (!shareCodeSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'This listing link is unavailable.'
        );
      }

      const shareLink =
        shareCodeSnapshot.data();

      const listingUid =
        typeof shareLink?.['listingUid'] ===
          'string'
          ? shareLink['listingUid'].trim()
          : '';

      if (
        !listingUid ||
        shareLink?.['active'] !== true
      ) {
        throw new HttpsError(
          'not-found',
          'This listing link is unavailable.'
        );
      }

      const listingSnapshot =
        await adminFirestore
          .collection('listings')
          .doc(listingUid)
          .get();

      if (
        !listingSnapshot.exists ||
        listingSnapshot.get('status') !==
          'active'
      ) {
        throw new HttpsError(
          'not-found',
          'This listing is no longer publicly available.'
        );
      }

      return {
        listingUid,
        listingPath:
          `/listings/${listingUid}`
      };
    }
  );

function normalizeShareCode(
  value: unknown
): string {
  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'The listing link is invalid.'
    );
  }

  const shareCode =
    value
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9_-]/g,
        ''
      );

  if (
    shareCode.length < 6 ||
    shareCode.length > 20
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The listing link is invalid.'
    );
  }

  return shareCode;
}