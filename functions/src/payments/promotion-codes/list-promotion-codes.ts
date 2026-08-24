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
    listPromotionCodeRecords,
    updatePromotionCodeRecord
} from './promotion-code-repository';

import type {
    ListPromotionCodesRequest,
    ListPromotionCodesResponse,
    PromotionCodeRecord,
    PromotionCodeStatus
} from './promotion-code-types';

const stripeSecretKey =
    defineSecret('STRIPE_SECRET_KEY');

export const listPromotionCodes =
    onCall<
        ListPromotionCodesRequest,
        Promise<ListPromotionCodesResponse>
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

            const includeInactive =
                request.data
                    ?.includeInactive !==
                false;

            const storedPromotionCodes =
                await listPromotionCodeRecords(
                    true
                );

            const stripe =
                new Stripe(
                    stripeSecretKey.value()
                );

            const synchronizedPromotionCodes =
                await Promise.all(
                    storedPromotionCodes.map(
                        promotionCode =>
                            synchronizePromotionCode(
                                stripe,
                                promotionCode
                            )
                    )
                );

            const visiblePromotionCodes =
                synchronizedPromotionCodes
                    .filter(
                        promotionCode =>
                            includeInactive ||
                            promotionCode.active
                    )
                    .sort(
                        (
                            firstPromotionCode,
                            secondPromotionCode
                        ) =>
                            secondPromotionCode
                                .createdAt
                                .localeCompare(
                                    firstPromotionCode
                                        .createdAt
                                )
                    );

            return {
                promotionCodes:
                    visiblePromotionCodes
            };
        }
    );

async function synchronizePromotionCode(
    stripe: Stripe,
    storedPromotionCode:
        PromotionCodeRecord
): Promise<PromotionCodeRecord> {
    try {
        const stripePromotionCode =
            await stripe
                .promotionCodes
                .retrieve(
                    storedPromotionCode
                        .stripePromotionCodeId
                );

        const expiresAt =
            stripePromotionCode
                .expires_at
                ? new Date(
                    stripePromotionCode
                        .expires_at *
                    1000
                ).toISOString()
                : storedPromotionCode
                    .expiresAt;

        const expired =
            isExpired(
                expiresAt
            );

        const active =
            stripePromotionCode.active &&
            !expired;

        const status:
            PromotionCodeStatus =
                expired
                    ? 'expired'
                    : active
                        ? 'active'
                        : 'inactive';

        const recordChanged =
            storedPromotionCode.active !==
                active ||
            storedPromotionCode.status !==
                status ||
            storedPromotionCode
                .timesRedeemed !==
                stripePromotionCode
                    .times_redeemed ||
            storedPromotionCode.expiresAt !==
                expiresAt;

        if (!recordChanged) {
            return storedPromotionCode;
        }

        return updatePromotionCodeRecord(
            storedPromotionCode.uid,
            {
                active,
                status,

                timesRedeemed:
                    stripePromotionCode
                        .times_redeemed,

                expiresAt
            }
        );
    } catch (error: unknown) {
        console.error(
            'Unable to synchronize promotion code:',
            {
                promotionCodeUid:
                    storedPromotionCode.uid,

                stripePromotionCodeId:
                    storedPromotionCode
                        .stripePromotionCodeId,

                error
            }
        );

        /*
         * One unavailable Stripe record should not
         * prevent the administrator from viewing every
         * other promotion stored by NavStreet.
         */
        return storedPromotionCode;
    }
}

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