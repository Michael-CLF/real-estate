import Stripe from 'stripe';

import {
  getApps,
  initializeApp
} from 'firebase-admin/app';

import {
  FieldValue,
  getFirestore
} from 'firebase-admin/firestore';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  defineSecret
} from 'firebase-functions/params';

import {
  callableFunctionOptions
} from '../shared/function-options';

import {
  validateListingPromotionCode
} from './promotion-codes/validate-listing-promotion-code';

if (getApps().length === 0) {
  initializeApp();
}

const stripeSecretKey =
  defineSecret(
    'STRIPE_SECRET_KEY'
  );

const DEVELOPMENT_SITE_URL =
  'http://localhost:4200';

const LISTING_FEE_CENTS = 4900;
const FEATURED_LISTING_FEE_CENTS = 1000;

interface CreateListingCheckoutSessionRequest {
  listingUid: string;

  promotionCode?:
  string |
  null;
}

interface CreateListingCheckoutSessionResult {
  checkoutSessionId: string;
  checkoutUrl: string;
  totalAmount: number;
}

interface ListingDraftDocument {
  sellerUid?: string;

  featuredListing?: boolean;

  progress?: {
    contentStatus?: string;
  };

  certification?: {
    accepted?: boolean;
  };

  publication?: {
    status?: string;
    identityStatus?: string;
    paymentStatus?: string;
    stripeCheckoutSessionId?: string;
  };
}

export const createListingCheckoutSession =
  onCall<
    CreateListingCheckoutSessionRequest,
    Promise<CreateListingCheckoutSessionResult>
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
          'You must be signed in to continue to payment.'
        );
      }

      const listingUid =
        request.data.listingUid
          ?.trim();

      if (!listingUid) {
        throw new HttpsError(
          'invalid-argument',
          'A listing draft is required.'
        );
      }

      const enteredPromotionCode =
        request.data
          .promotionCode
          ?.trim() ?? '';

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

      const firestore =
        getFirestore();

      const draftReference =
        firestore
          .collection(
            'listingDrafts'
          )
          .doc(
            listingUid
          );

      const draftSnapshot =
        await draftReference.get();

      if (!draftSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'The listing draft could not be found.'
        );
      }

      const draft =
        draftSnapshot.data() as
        | ListingDraftDocument
        | undefined;

      if (!draft) {
        throw new HttpsError(
          'not-found',
          'The listing draft could not be read.'
        );
      }

      if (
        draft.sellerUid !==
        sellerUid
      ) {
        throw new HttpsError(
          'permission-denied',
          'You do not have permission to pay for this listing.'
        );
      }

      if (
        draft.progress
          ?.contentStatus !==
        'complete'
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Complete the listing before continuing to payment.'
        );
      }

      if (
        draft.certification
          ?.accepted !==
        true
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Seller certification must be accepted before continuing to payment.'
        );
      }

      if (
        draft.publication
          ?.identityStatus !==
        'verified'
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Identity verification must be completed before payment.'
        );
      }

      if (
        draft.publication
          ?.paymentStatus ===
        'paid' ||
        draft.publication
          ?.paymentStatus ===
        'no_payment_required' ||
        draft.publication
          ?.status ===
        'published'
      ) {
        throw new HttpsError(
          'already-exists',
          'Payment has already been completed for this listing.'
        );
      }

      const stripe =
        new Stripe(
          stripeSecretKey.value()
        );

      const includesFeaturedUpgrade =
        draft.featuredListing ===
        true;

      const featuredListingFeeCents =
        includesFeaturedUpgrade
          ? FEATURED_LISTING_FEE_CENTS
          : 0;

      const subtotalAmountCents =
        LISTING_FEE_CENTS +
        featuredListingFeeCents;

      let normalizedPromotionCode =
        '';

      let stripePromotionCodeId =
        '';

      let promotionCodeUid =
        '';

      let discountAmountCents =
        0;

      let totalAmountCents =
        subtotalAmountCents;

      if (enteredPromotionCode) {
        const validation =
          await validateListingPromotionCode({
            stripe,
            listingUid,
            sellerUid,

            customerEmail:
              request.auth
                ?.token?.email
                ? String(
                  request.auth
                    .token.email
                )
                : null,

            code:
              enteredPromotionCode,

            listingPriceId,
            featuredPriceId
          });

        normalizedPromotionCode =
          validation
            .normalizedCode;

        stripePromotionCodeId =
          validation
            .stripePromotionCodeId;

        promotionCodeUid =
          validation
            .promotionCodeRecord
            .uid;

        discountAmountCents =
          validation
            .discountAmountCents;

        totalAmountCents =
          validation
            .totalAmountCents;
      }

      const existingCheckoutSessionId =
        draft.publication
          ?.stripeCheckoutSessionId;

      if (existingCheckoutSessionId) {
        try {
          const existingSession =
            await stripe
              .checkout
              .sessions
              .retrieve(
                existingCheckoutSessionId
              );

          const existingSessionMatchesDraft =
            existingSession
              .metadata
            ?.['listingPriceId'] ===
            listingPriceId &&

            existingSession
              .metadata
            ?.['featuredPriceId'] ===
            (
              includesFeaturedUpgrade
                ? featuredPriceId
                : ''
            ) &&

            existingSession
              .metadata
            ?.['featuredListing'] ===
            String(
              includesFeaturedUpgrade
            ) &&

            existingSession
              .metadata
            ?.[
            'stripePromotionCodeId'
            ] ===
            stripePromotionCodeId &&

            existingSession
              .metadata
            ?.['promotionCodeUid'] ===
            promotionCodeUid &&

            existingSession
              .metadata
            ?.['promotionCode'] ===
            normalizedPromotionCode;

          if (
            existingSession.status ===
            'open' &&
            existingSession.url &&
            existingSessionMatchesDraft
          ) {
            return {
              checkoutSessionId:
                existingSession.id,

              checkoutUrl:
                existingSession.url,

              totalAmount:
                existingSession
                  .amount_total ??
                totalAmountCents
            };
          }

          if (
            existingSession.status ===
            'open' &&
            !existingSessionMatchesDraft
          ) {
            await stripe
              .checkout
              .sessions
              .expire(
                existingSession.id
              );
          }

          if (
            existingSession
              .payment_status ===
            'paid' ||
            existingSession
              .payment_status ===
            'no_payment_required'
          ) {
            throw new HttpsError(
              'already-exists',
              'Checkout has already been completed for this listing.'
            );
          }
        } catch (error) {
          if (
            error instanceof
            HttpsError
          ) {
            throw error;
          }

          console.error(
            'The existing Stripe Checkout session could not be reused.',
            {
              listingUid,
              sellerUid,
              existingCheckoutSessionId,
              error
            }
          );
        }
      }

      const lineItems:
        Stripe.Checkout.SessionCreateParams.LineItem[] = [
          {
            price:
              listingPriceId,

            quantity:
              1
          }
        ];

      if (includesFeaturedUpgrade) {
        lineItems.push({
          price:
            featuredPriceId,

          quantity:
            1
        });
      }

      const discounts:
        Stripe.Checkout.SessionCreateParams.Discount[] |
        undefined =
        stripePromotionCodeId
          ? [
            {
              promotion_code:
                stripePromotionCodeId
            }
          ]
          : undefined;

      const applicationUrl =
        process.env[
          'NAVSTREET_APP_URL'
        ]
          ?.trim()
          .replace(
            /\/$/,
            ''
          ) ||
        DEVELOPMENT_SITE_URL;

      try {
        const checkoutSession =
          await stripe
            .checkout
            .sessions
            .create({
              mode:
                'payment',

              customer_email:
                request.auth
                  ?.token?.email
                  ? String(
                    request.auth
                      .token.email
                  )
                  : undefined,

              client_reference_id:
                listingUid,

              line_items:
                lineItems,

              discounts,

              metadata: {
                listingUid,
                sellerUid,

                listingPriceId,

                featuredPriceId:
                  includesFeaturedUpgrade
                    ? featuredPriceId
                    : '',

                featuredListing:
                  String(
                    includesFeaturedUpgrade
                  ),

                listingFeeCents:
                  String(
                    LISTING_FEE_CENTS
                  ),

                featuredListingFeeCents:
                  String(
                    featuredListingFeeCents
                  ),

                subtotalAmountCents:
                  String(
                    subtotalAmountCents
                  ),

                discountAmountCents:
                  String(
                    discountAmountCents
                  ),

                finalAmountCents:
                  String(
                    totalAmountCents
                  ),

                promotionCode:
                  normalizedPromotionCode,

                stripePromotionCodeId,

                promotionCodeUid
              },

              success_url:
                `${applicationUrl}` +
                `/sell/listings/${listingUid}` +
                `/payment-return` +
                `?session_id={CHECKOUT_SESSION_ID}`,

              cancel_url:
                `${applicationUrl}` +
                `/sell/listings/${listingUid}` +
                `/payment?payment=cancelled`
            });

        if (!checkoutSession.url) {
          throw new Error(
            'Stripe did not return a Checkout URL.'
          );
        }

        const stripeTotalAmountCents =
          checkoutSession
            .amount_total ??
          totalAmountCents;

        await draftReference.update({
          'publication.status':
            'payment_processing',

          'publication.paymentStatus':
            'pending',

          'publication.stripeCheckoutSessionId':
            checkoutSession.id,

          'publication.paymentAmount':
            stripeTotalAmountCents /
            100,

                    'publication.paymentBreakdown': {
            listingFee:
              LISTING_FEE_CENTS /
              100,

            featuredListingFee:
              featuredListingFeeCents /
              100,

            subtotalAmount:
              subtotalAmountCents /
              100,

            discountAmount:
              discountAmountCents /
              100,

            totalAmount:
              stripeTotalAmountCents /
              100,

            promotionCode:
              normalizedPromotionCode ||
              null,

            stripePromotionCodeId:
              stripePromotionCodeId ||
              null,

            promotionCodeUid:
              promotionCodeUid ||
              null
          },

          'publication.checkoutCreatedAt':
            FieldValue
              .serverTimestamp(),

          updatedAt:
            FieldValue
              .serverTimestamp(),

          lastSavedAt:
            FieldValue
              .serverTimestamp()
        });

        return {
          checkoutSessionId:
            checkoutSession.id,

          checkoutUrl:
            checkoutSession.url,

          totalAmount:
            stripeTotalAmountCents
        };
      } catch (error) {
        console.error(
          'Stripe Checkout session creation failed.',
          {
            listingUid,
            sellerUid,
            promotionCode:
              normalizedPromotionCode ||
              null,
            stripePromotionCodeId:
              stripePromotionCodeId ||
              null,
            error
          }
        );

        if (
          error instanceof
          HttpsError
        ) {
          throw error;
        }

        throw new HttpsError(
          'internal',
          'The secure payment page could not be opened. Please try again.'
        );
      }
    }
  );