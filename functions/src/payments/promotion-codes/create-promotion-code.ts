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
    createPromotionCodeUid,
    getPromotionCodeByCode,
    normalizePromotionCode,
    savePromotionCode
} from './promotion-code-repository';

import type {
    CreatePromotionCodeRequest,
    CreatePromotionCodeResponse,
    PromotionCodeRecord,
    PromotionEligibleProduct
} from './promotion-code-types';

const stripeSecretKey =
    defineSecret('STRIPE_SECRET_KEY');

const MINIMUM_CODE_LENGTH = 4;
const MAXIMUM_CODE_LENGTH = 32;

export const createPromotionCode =
    onCall<
        CreatePromotionCodeRequest,
        Promise<CreatePromotionCodeResponse>
    >(
        {
            ...callableFunctionOptions,

            secrets: [
                stripeSecretKey
            ]
        },

        async request => {
            requireAdministrator(
                request.auth
            );

            const administratorUid =
                request.auth!.uid;

            const normalizedName =
                request.data.name
                    ?.trim();

            const normalizedCode =
                normalizePromotionCode(
                    request.data.code ?? ''
                );

            if (!normalizedName) {
                throw new HttpsError(
                    'invalid-argument',
                    'Enter a name for the promotion.'
                );
            }

            validatePromotionCode(
                normalizedCode
            );

            validateDiscount(
                request.data
            );

            const existingPromotionCode =
                await getPromotionCodeByCode(
                    normalizedCode
                );

            if (
                existingPromotionCode &&
                existingPromotionCode.active
            ) {
                throw new HttpsError(
                    'already-exists',
                    'An active promotion code with this code already exists.'
                );
            }

            const eligiblePriceId =
                getEligiblePriceId(
                    request.data
                        .eligibleProduct
                );

            const stripe =
                new Stripe(
                    stripeSecretKey.value()
                );

            const stripePrice =
                await stripe.prices.retrieve(
                    eligiblePriceId
                );

            const stripeProductId =
                typeof stripePrice.product ===
                    'string'
                    ? stripePrice.product
                    : stripePrice.product.id;

            const promotionCodeUid =
                createPromotionCodeUid();

            const couponParameters:
                Stripe.CouponCreateParams = {
                name:
                    normalizedName,

                duration:
                    'once',

                applies_to: {
                    products: [
                        stripeProductId
                    ]
                },

                metadata: {
                    navStreetPromotionCodeUid:
                        promotionCodeUid,

                    navStreetEligibleProduct:
                        request.data
                            .eligibleProduct
                }
            };

            if (
                request.data.discountType ===
                    'percentage'
            ) {
                couponParameters.percent_off =
                    request.data.percentOff;
            } else {
                couponParameters.amount_off =
                    request.data
                        .amountOffCents;

                couponParameters.currency =
                    normalizeCurrency(
                        request.data.currency
                    );
            }

            let stripeCoupon:
                Stripe.Coupon | null = null;

            let stripePromotionCode:
                Stripe.PromotionCode | null =
                    null;

            try {
                stripeCoupon =
                    await stripe.coupons.create(
                        couponParameters
                    );

                stripePromotionCode =
                    await stripe
                        .promotionCodes
                        .create({
                            promotion: {
                                type:
                                    'coupon',

                                coupon:
                                    stripeCoupon.id
                            },

                            code:
                                normalizedCode,

                            active:
                                true,

                            expires_at:
                                parseOptionalExpiration(
                                    request.data
                                        .expiresAt
                                ),

                            max_redemptions:
                                parseOptionalMaximumRedemptions(
                                    request.data
                                        .maxRedemptions
                                ),

                            restrictions: {
                                first_time_transaction:
                                    request.data
                                        .firstTimeTransactionOnly
                            },

                            metadata: {
                                navStreetPromotionCodeUid:
                                    promotionCodeUid,

                                navStreetEligibleProduct:
                                    request.data
                                        .eligibleProduct
                            }
                        });

                const now =
                    new Date().toISOString();

                const promotionCodeRecord:
                    PromotionCodeRecord = {
                    uid:
                        promotionCodeUid,

                    name:
                        normalizedName,

                    code:
                        normalizedCode,

                    discountType:
                        request.data
                            .discountType,

                    eligibleProduct:
                        request.data
                            .eligibleProduct,

                    eligiblePriceId,

                    stripeProductId,

                    stripeCouponId:
                        stripeCoupon.id,

                    stripePromotionCodeId:
                        stripePromotionCode.id,

                    status:
                        'active',

                    active:
                        true,

                    firstTimeTransactionOnly:
                        request.data
                            .firstTimeTransactionOnly,

                    maxRedemptions:
                        request.data
                            .maxRedemptions ??
                        null,

                    timesRedeemed:
                        stripePromotionCode
                            .times_redeemed,

                    expiresAt:
                        request.data
                            .expiresAt ??
                        null,

                    createdByUid:
                        administratorUid,

                    createdAt:
                        now,

                    updatedAt:
                        now
                };

                if (
                    request.data.discountType ===
                        'percentage'
                ) {
                    promotionCodeRecord.percentOff =
                        request.data.percentOff;
                } else {
                    promotionCodeRecord.amountOffCents =
                        request.data
                            .amountOffCents;

                    promotionCodeRecord.currency =
                        normalizeCurrency(
                            request.data.currency
                        );
                }

                await savePromotionCode(
                    promotionCodeRecord
                );

                return {
                    promotionCode:
                        promotionCodeRecord
                };
            } catch (error: unknown) {
                await cleanUpIncompletePromotion(
                    stripe,
                    stripeCoupon,
                    stripePromotionCode
                );

                console.error(
                    'Unable to create promotion code:',
                    error
                );

                if (
                    error instanceof
                    Stripe.errors.StripeError
                ) {
                    throw new HttpsError(
                        'failed-precondition',
                        error.message
                    );
                }

                if (
                    error instanceof HttpsError
                ) {
                    throw error;
                }

                throw new HttpsError(
                    'internal',
                    'The promotion code could not be created.'
                );
            }
        }
    );

function requireAdministrator(
    authentication:
        {
            uid: string;

            token:
                Record<string, unknown>;
        } |
        undefined
): void {
    if (!authentication) {
        throw new HttpsError(
            'unauthenticated',
            'You must be signed in.'
        );
    }

    const isAdministrator =
        authentication.token['admin'] ===
            true ||
        authentication.token['role'] ===
            'admin';

    if (!isAdministrator) {
        throw new HttpsError(
            'permission-denied',
            'Administrator access is required.'
        );
    }
}

function validatePromotionCode(
    code: string
): void {
    if (
        code.length <
            MINIMUM_CODE_LENGTH ||
        code.length >
            MAXIMUM_CODE_LENGTH
    ) {
        throw new HttpsError(
            'invalid-argument',
            'The promotion code must contain between 4 and 32 letters or numbers.'
        );
    }

    if (!/^[A-Z0-9]+$/.test(code)) {
        throw new HttpsError(
            'invalid-argument',
            'The promotion code may contain only letters and numbers.'
        );
    }
}

function validateDiscount(
    promotion:
        CreatePromotionCodeRequest
): void {
    if (
        promotion.discountType ===
            'percentage'
    ) {
        const percentOff =
            promotion.percentOff;

        if (
            typeof percentOff !==
                'number' ||
            !Number.isFinite(
                percentOff
            ) ||
            percentOff <= 0 ||
            percentOff > 100
        ) {
            throw new HttpsError(
                'invalid-argument',
                'Enter a percentage between 1 and 100.'
            );
        }

        return;
    }

    const amountOffCents =
        promotion.amountOffCents;

    if (
        typeof amountOffCents !==
            'number' ||
        !Number.isInteger(
            amountOffCents
        ) ||
        amountOffCents <= 0
    ) {
        throw new HttpsError(
            'invalid-argument',
            'Enter a valid fixed discount amount.'
        );
    }

    normalizeCurrency(
        promotion.currency
    );
}

function getEligiblePriceId(
    eligibleProduct:
        PromotionEligibleProduct
): string {
    let priceId = '';

    switch (eligibleProduct) {
        case 'property_listing':
            priceId =
                process.env[
                    'STRIPE_LISTING_PRICE_ID'
                ] ?? '';
            break;

        case 'featured_listing':
            priceId =
                process.env[
                    'STRIPE_FEATURED_LISTING_PRICE_ID'
                ] ?? '';
            break;

        case 'business_profile':
            priceId =
                process.env[
                    'STRIPE_PROFESSIONAL_PROFILE_PRICE_ID'
                ] ?? '';
            break;

        default:
            throw new HttpsError(
                'invalid-argument',
                'Select a valid NavStreet product.'
            );
    }

    const normalizedPriceId =
        priceId.trim();

    if (
        !normalizedPriceId.startsWith(
            'price_'
        )
    ) {
        throw new HttpsError(
            'failed-precondition',
            `The Stripe Price ID for ${eligibleProduct} is not configured.`
        );
    }

    return normalizedPriceId;
}

function normalizeCurrency(
    currency:
        string |
        undefined
): string {
    const normalizedCurrency =
        (
            currency ??
            'usd'
        )
            .trim()
            .toLowerCase();

    if (
        !/^[a-z]{3}$/.test(
            normalizedCurrency
        )
    ) {
        throw new HttpsError(
            'invalid-argument',
            'Enter a valid three-letter currency.'
        );
    }

    return normalizedCurrency;
}

function parseOptionalExpiration(
    expiresAt:
        string |
        null |
        undefined
): number | undefined {
    if (!expiresAt) {
        return undefined;
    }

    const expirationDate =
        new Date(expiresAt);

    if (
        Number.isNaN(
            expirationDate.getTime()
        ) ||
        expirationDate.getTime() <=
            Date.now()
    ) {
        throw new HttpsError(
            'invalid-argument',
            'The promotion expiration must be a future date and time.'
        );
    }

    return Math.floor(
        expirationDate.getTime() /
        1000
    );
}

function parseOptionalMaximumRedemptions(
    maximumRedemptions:
        number |
        null |
        undefined
): number | undefined {
    if (
        maximumRedemptions ===
            undefined ||
        maximumRedemptions === null
    ) {
        return undefined;
    }

    if (
        !Number.isInteger(
            maximumRedemptions
        ) ||
        maximumRedemptions <= 0
    ) {
        throw new HttpsError(
            'invalid-argument',
            'Maximum redemptions must be a positive whole number.'
        );
    }

    return maximumRedemptions;
}

async function cleanUpIncompletePromotion(
    stripe: Stripe,
    coupon:
        Stripe.Coupon |
        null,
    promotionCode:
        Stripe.PromotionCode |
        null
): Promise<void> {
    if (promotionCode) {
        try {
            await stripe
                .promotionCodes
                .update(
                    promotionCode.id,
                    {
                        active:
                            false
                    }
                );
        } catch (cleanupError) {
            console.error(
                'Unable to deactivate incomplete Stripe promotion code:',
                cleanupError
            );
        }
    }

    if (coupon) {
        try {
            await stripe.coupons.del(
                coupon.id
            );
        } catch (cleanupError) {
            console.error(
                'Unable to remove incomplete Stripe coupon:',
                cleanupError
            );
        }
    }
}