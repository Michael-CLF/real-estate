import Stripe from 'stripe';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  defineSecret
} from 'firebase-functions/params';

import {
  callableFunctionOptions
} from '../../shared/function-options';

import {
  validateListingPromotionCode
} from './validate-listing-promotion-code';

import type {
  ValidateListingPromotionRequest,
  ValidateListingPromotionResponse
} from './promotion-code-types';

const stripeSecretKey =
  defineSecret(
    'STRIPE_SECRET_KEY'
  );

export const validateListingPromotion =
  onCall<
    ValidateListingPromotionRequest,
    Promise<ValidateListingPromotionResponse>
  >(
    {
      ...callableFunctionOptions,

      secrets: [
        stripeSecretKey
      ]
    },

    async request => {
      const sellerUid =
        request.auth?.uid;

      if (!sellerUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must be signed in to validate a promotion code.'
        );
      }

      const listingUid =
        request.data.listingUid
          ?.trim();

      const code =
        request.data.code
          ?.trim();

      if (!listingUid) {
        throw new HttpsError(
          'invalid-argument',
          'A listing draft is required.'
        );
      }

      if (!code) {
        throw new HttpsError(
          'invalid-argument',
          'Enter a promotion code.'
        );
      }

      const listingPriceId =
        process.env[
          'STRIPE_LISTING_PRICE_ID'
        ]?.trim() ?? '';

      const featuredPriceId =
        process.env[
          'STRIPE_FEATURED_LISTING_PRICE_ID'
        ]?.trim() ?? '';

      if (
        !listingPriceId.startsWith(
          'price_'
        )
      ) {
        throw new HttpsError(
          'failed-precondition',
          'The Stripe listing price is not configured correctly.'
        );
      }

      if (
        !featuredPriceId.startsWith(
          'price_'
        )
      ) {
        throw new HttpsError(
          'failed-precondition',
          'The Stripe Featured Property price is not configured correctly.'
        );
      }

      const stripe =
        new Stripe(
          stripeSecretKey.value()
        );

      const validation =
        await validateListingPromotionCode({
          stripe,
          listingUid,
          sellerUid,

          customerEmail:
            request.auth?.token?.email
              ? String(
                  request.auth
                    .token.email
                )
              : null,

          code,
          listingPriceId,
          featuredPriceId
        });

      return {
        valid:
          true,

        code:
          validation.normalizedCode,

        stripePromotionCodeId:
          validation
            .stripePromotionCodeId,

        listingFeeCents:
          validation
            .listingFeeCents,

        featuredListingFeeCents:
          validation
            .featuredListingFeeCents,

        subtotalAmountCents:
          validation
            .subtotalAmountCents,

        discountAmountCents:
          validation
            .discountAmountCents,

        totalAmountCents:
          validation
            .totalAmountCents
      };
    }
  );