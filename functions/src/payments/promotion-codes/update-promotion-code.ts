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
    getPromotionCodeByUid,
    updatePromotionCodeRecord
} from './promotion-code-repository';

import type {
    UpdatePromotionCodeRequest,
    UpdatePromotionCodeResponse
} from './promotion-code-types';

const stripeSecretKey =
    defineSecret('STRIPE_SECRET_KEY');

export const updatePromotionCode =
    onCall<
        UpdatePromotionCodeRequest,
        Promise<UpdatePromotionCodeResponse>
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

            const promotionCodeUid =
                request.data
                    .promotionCodeUid
                    ?.trim();

            if (!promotionCodeUid) {
                throw new HttpsError(
                    'invalid-argument',
                    'A promotion code is required.'
                );
            }

            if (
                typeof request.data.active !==
                    'boolean'
            ) {
                throw new HttpsError(
                    'invalid-argument',
                    'Select whether the promotion code should be active.'
                );
            }

            const existingPromotionCode =
                await getPromotionCodeByUid(
                    promotionCodeUid
                );

            if (!existingPromotionCode) {
                throw new HttpsError(
                    'not-found',
                    'The promotion code could not be found.'
                );
            }

            if (
                request.data.active &&
                isExpired(
                    existingPromotionCode
                        .expiresAt
                )
            ) {
                throw new HttpsError(
                    'failed-precondition',
                    'An expired promotion code cannot be reactivated. Create a replacement code instead.'
                );
            }

            if (
                existingPromotionCode.active ===
                    request.data.active
            ) {
                return {
                    promotionCode:
                        existingPromotionCode
                };
            }

            const stripe =
                new Stripe(
                    stripeSecretKey.value()
                );

            try {
                const stripePromotionCode =
                    await stripe
                        .promotionCodes
                        .update(
                            existingPromotionCode
                                .stripePromotionCodeId,
                            {
                                active:
                                    request.data.active
                            }
                        );

                const updatedPromotionCode =
                    await updatePromotionCodeRecord(
                        promotionCodeUid,
                        {
                            active:
                                stripePromotionCode
                                    .active,

                            status:
                                stripePromotionCode
                                    .active
                                    ? 'active'
                                    : 'inactive',

                            timesRedeemed:
                                stripePromotionCode
                                    .times_redeemed
                        }
                    );

                return {
                    promotionCode:
                        updatedPromotionCode
                };
            } catch (error: unknown) {
                console.error(
                    'Unable to update promotion code:',
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
                    'The promotion code could not be updated.'
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

function isExpired(
    expiresAt:
        string |
        null
): boolean {
    if (!expiresAt) {
        return false;
    }

    const expirationDate =
        new Date(expiresAt);

    if (
        Number.isNaN(
            expirationDate.getTime()
        )
    ) {
        return false;
    }

    return (
        expirationDate.getTime() <=
        Date.now()
    );
}