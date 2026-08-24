import Stripe from 'stripe';

import {
  getFirestore
} from 'firebase-admin/firestore';

import {
  HttpsError
} from 'firebase-functions/v2/https';

import {
  getPromotionCodeByCode,
  normalizePromotionCode
} from './promotion-code-repository';

import type {
  PromotionCodeRecord
} from './promotion-code-types';

const LISTING_FEE_CENTS = 4900;
const FEATURED_LISTING_FEE_CENTS = 1000;

interface ListingDraftDocument {
  sellerUid?: string;

  featuredListing?: boolean;

  publication?: {
    status?: string;
    paymentStatus?: string;
  };
}

export interface ValidateListingPromotionCodeInput {
  stripe: Stripe;
  listingUid: string;
  sellerUid: string;
  customerEmail?: string | null;
  code: string;
  listingPriceId: string;
  featuredPriceId: string;
}

export interface ValidatedListingPromotion {
  promotionCodeRecord:
  PromotionCodeRecord;

  normalizedCode: string;

  stripePromotionCodeId: string;

  listingFeeCents: number;
  featuredListingFeeCents: number;
  subtotalAmountCents: number;
  discountAmountCents: number;
  totalAmountCents: number;
}

export async function validateListingPromotionCode(
  input:
    ValidateListingPromotionCodeInput
): Promise<ValidatedListingPromotion> {
  const listingUid =
    input.listingUid.trim();

  const sellerUid =
    input.sellerUid.trim();

  const normalizedCode =
    normalizePromotionCode(
      input.code
    );

  if (!listingUid) {
    throw new HttpsError(
      'invalid-argument',
      'A listing draft is required.'
    );
  }

  if (!sellerUid) {
    throw new HttpsError(
      'unauthenticated',
      'You must be signed in to validate a promotion code.'
    );
  }

  if (!normalizedCode) {
    throw new HttpsError(
      'invalid-argument',
      'Enter a promotion code.'
    );
  }

  const firestore =
    getFirestore();

  const draftSnapshot =
    await firestore
      .collection('listingDrafts')
      .doc(listingUid)
      .get();

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

  if (draft.sellerUid !== sellerUid) {
    throw new HttpsError(
      'permission-denied',
      'You do not have permission to use a promotion code for this listing.'
    );
  }

  if (
    draft.publication?.paymentStatus ===
    'paid' ||
    draft.publication?.paymentStatus ===
    'no_payment_required' ||
    draft.publication?.status ===
    'published'
  ) {
    throw new HttpsError(
      'already-exists',
      'Payment has already been completed for this listing.'
    );
  }

  const promotionCodeRecord =
    await getPromotionCodeByCode(
      normalizedCode
    );

  if (!promotionCodeRecord) {
    throw invalidPromotionCode();
  }

  if (
    !promotionCodeRecord.active ||
    promotionCodeRecord.status !==
    'active'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This promotion code is not active.'
    );
  }

  if (
    promotionCodeRecord
      .eligibleProduct !==
    'property_listing'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This promotion code cannot be used for a property listing.'
    );
  }

  if (
    promotionCodeRecord
      .eligiblePriceId !==
    input.listingPriceId
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This promotion code does not apply to the current Property Listing price.'
    );
  }

  validateStoredExpiration(
    promotionCodeRecord
  );

  validateStoredRedemptionLimit(
    promotionCodeRecord
  );

  let stripePromotionCode:
    Stripe.PromotionCode;

  try {
    stripePromotionCode =
      await input.stripe
        .promotionCodes
        .retrieve(
          promotionCodeRecord
            .stripePromotionCodeId
        );
  } catch (error) {
    console.error(
      'Stripe promotion-code retrieval failed.',
      {
        listingUid,
        sellerUid,
        promotionCodeUid:
          promotionCodeRecord.uid,
        stripePromotionCodeId:
          promotionCodeRecord
            .stripePromotionCodeId,
        error
      }
    );

    throw invalidPromotionCode();
  }

  if (!stripePromotionCode.active) {
    throw new HttpsError(
      'failed-precondition',
      'This promotion code is not active.'
    );
  }

  validateStripePromotionExpiration(
    stripePromotionCode
  );

  validateStripePromotionRedemptions(
    stripePromotionCode
  );

  let coupon:
    Stripe.Coupon;

  try {

    coupon =
      await input.stripe
        .coupons
        .retrieve(
          promotionCodeRecord
            .stripeCouponId,
          {
            expand: [
              'applies_to'
            ]
          }
        );
  } catch (error) {
    console.error(
      'Stripe coupon retrieval failed.',
      {
        listingUid,
        sellerUid,
        promotionCodeUid:
          promotionCodeRecord.uid,
        stripeCouponId:
          promotionCodeRecord
            .stripeCouponId,
        error
      }
    );

    throw new HttpsError(
      'failed-precondition',
      'The discount connected to this promotion code could not be verified.'
    );
  }

  if (!coupon.valid) {
    throw new HttpsError(
      'failed-precondition',
      'The discount connected to this promotion code is no longer valid.'
    );
  }

  validateCouponExpiration(
    coupon
  );

  validateCouponRedemptions(
    coupon
  );

  const listingPrice =
    await input.stripe
      .prices
      .retrieve(
        input.listingPriceId
      );

  const listingProductId =
    typeof listingPrice.product ===
      'string'
      ? listingPrice.product
      : listingPrice.product.id;

  if (
    listingProductId !==
    promotionCodeRecord
      .stripeProductId
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This promotion code does not apply to the current Property Listing product.'
    );
  }

  const applicableProducts =
    coupon.applies_to?.products ??
    [];

  if (
    applicableProducts.length === 0 ||
    !applicableProducts.includes(
      listingProductId
    )
  ) {
    console.error(
      'Promotion coupon product mismatch.',
      {
        listingUid,
        promotionCodeUid:
          promotionCodeRecord.uid,

        listingPriceId:
          input.listingPriceId,

        listingProductId,

        storedEligiblePriceId:
          promotionCodeRecord
            .eligiblePriceId,

        storedStripeProductId:
          promotionCodeRecord
            .stripeProductId,

        stripeCouponId:
          coupon.id,

        applicableProducts
      }
    );

    throw new HttpsError(
      'failed-precondition',
      'This promotion code does not apply to the Property Listing product.'
    );
  }

  const featuredListingFeeCents =
    draft.featuredListing === true
      ? FEATURED_LISTING_FEE_CENTS
      : 0;

  const subtotalAmountCents =
    LISTING_FEE_CENTS +
    featuredListingFeeCents;

  validateMinimumPurchase(
    stripePromotionCode,
    subtotalAmountCents
  );

  if (
    stripePromotionCode
      .restrictions
      ?.first_time_transaction ===
    true
  ) {
    await validateFirstTransactionRestriction(
      input.stripe,
      input.customerEmail
    );
  }

  const discountAmountCents =
    calculateListingDiscount(
      coupon
    );

  return {
    promotionCodeRecord,
    normalizedCode,

    stripePromotionCodeId:
      stripePromotionCode.id,

    listingFeeCents:
      LISTING_FEE_CENTS,

    featuredListingFeeCents,

    subtotalAmountCents,

    discountAmountCents,

    totalAmountCents:
      Math.max(
        0,
        subtotalAmountCents -
        discountAmountCents
      )
  };
}

function calculateListingDiscount(
  coupon:
    Stripe.Coupon
): number {
  if (
    typeof coupon.percent_off ===
    'number'
  ) {
    return Math.min(
      LISTING_FEE_CENTS,
      Math.round(
        LISTING_FEE_CENTS *
        (
          coupon.percent_off /
          100
        )
      )
    );
  }

  if (
    typeof coupon.amount_off ===
    'number'
  ) {
    const currency =
      coupon.currency
        ?.trim()
        .toLowerCase();

    if (currency !== 'usd') {
      throw new HttpsError(
        'failed-precondition',
        'This promotion code uses an unsupported currency.'
      );
    }

    return Math.min(
      LISTING_FEE_CENTS,
      coupon.amount_off
    );
  }

  throw new HttpsError(
    'failed-precondition',
    'This promotion code does not contain a valid discount.'
  );
}

function validateStoredExpiration(
  promotionCode:
    PromotionCodeRecord
): void {
  if (!promotionCode.expiresAt) {
    return;
  }

  const expiration =
    new Date(
      promotionCode.expiresAt
    );

  if (
    Number.isNaN(
      expiration.getTime()
    ) ||
    expiration.getTime() <=
    Date.now()
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This promotion code has expired.'
    );
  }
}

function validateStoredRedemptionLimit(
  promotionCode:
    PromotionCodeRecord
): void {
  if (
    promotionCode.maxRedemptions !==
    null &&
    promotionCode.timesRedeemed >=
    promotionCode.maxRedemptions
  ) {
    throw new HttpsError(
      'resource-exhausted',
      'This promotion code has reached its maximum number of redemptions.'
    );
  }
}

function validateStripePromotionExpiration(
  promotionCode:
    Stripe.PromotionCode
): void {
  if (
    promotionCode.expires_at &&
    promotionCode.expires_at *
    1000 <=
    Date.now()
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This promotion code has expired.'
    );
  }
}

function validateStripePromotionRedemptions(
  promotionCode:
    Stripe.PromotionCode
): void {
  if (
    promotionCode.max_redemptions !==
    null &&
    promotionCode.times_redeemed >=
    promotionCode.max_redemptions
  ) {
    throw new HttpsError(
      'resource-exhausted',
      'This promotion code has reached its maximum number of redemptions.'
    );
  }
}

function validateCouponExpiration(
  coupon:
    Stripe.Coupon
): void {
  if (
    coupon.redeem_by &&
    coupon.redeem_by *
    1000 <=
    Date.now()
  ) {
    throw new HttpsError(
      'failed-precondition',
      'The discount connected to this promotion code has expired.'
    );
  }
}

function validateCouponRedemptions(
  coupon:
    Stripe.Coupon
): void {
  if (
    coupon.max_redemptions !==
    null &&
    coupon.times_redeemed >=
    coupon.max_redemptions
  ) {
    throw new HttpsError(
      'resource-exhausted',
      'The discount connected to this promotion code has reached its redemption limit.'
    );
  }
}

function validateMinimumPurchase(
  promotionCode:
    Stripe.PromotionCode,
  subtotalAmountCents:
    number
): void {
  const minimumAmount =
    promotionCode.restrictions
      ?.minimum_amount;

  if (
    typeof minimumAmount ===
    'number' &&
    subtotalAmountCents <
    minimumAmount
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This purchase does not meet the promotion code’s minimum amount.'
    );
  }

  const minimumCurrency =
    promotionCode.restrictions
      ?.minimum_amount_currency
      ?.trim()
      .toLowerCase();

  if (
    minimumCurrency &&
    minimumCurrency !== 'usd'
  ) {
    throw new HttpsError(
      'failed-precondition',
      'This promotion code uses an unsupported currency.'
    );
  }
}

async function validateFirstTransactionRestriction(
  stripe:
    Stripe,
  customerEmail:
    string |
    null |
    undefined
): Promise<void> {
  const normalizedEmail =
    customerEmail
      ?.trim()
      .toLowerCase();

  if (!normalizedEmail) {
    throw new HttpsError(
      'failed-precondition',
      'An email address is required to use this first-transaction promotion code.'
    );
  }

  const customers =
    await stripe.customers.list({
      email:
        normalizedEmail,

      limit:
        100
    });

  for (
    const customer of
    customers.data
  ) {
    const [
      paymentIntents,
      invoices
    ] =
      await Promise.all([
        stripe.paymentIntents.list({
          customer:
            customer.id,

          limit:
            100
        }),

        stripe.invoices.list({
          customer:
            customer.id,

          limit:
            100
        })
      ]);

    const hasSuccessfulPayment =
      paymentIntents.data.some(
        paymentIntent =>
          paymentIntent.status ===
          'succeeded'
      );

    const hasPriorInvoice =
      invoices.data.some(
        invoice =>
          invoice.status !==
          'draft' &&
          invoice.status !==
          'void'
      );

    if (
      hasSuccessfulPayment ||
      hasPriorInvoice
    ) {
      throw new HttpsError(
        'failed-precondition',
        'This promotion code is limited to a customer’s first Stripe transaction.'
      );
    }
  }
}

function invalidPromotionCode():
  HttpsError {
  return new HttpsError(
    'not-found',
    'The promotion code is invalid.'
  );
}