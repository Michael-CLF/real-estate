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

import { createPromotionCodeForAdministrator } from './create-promotion-code';

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

            if (request.data.replacement) {
                const oldCode = await getPromotionCodeByUid(promotionCodeUid);
                if (!oldCode || oldCode.archived) {
                    throw new HttpsError('not-found', 'The promotion code could not be found.');
                }
                const replacement = request.data.replacement;
                if (replacement.code.trim().toUpperCase() === oldCode.code) {
                    throw new HttpsError('invalid-argument',
                        'To change discount settings, enter a different customer-facing code. Stripe cannot safely replace an active code with the same code.');
                }
                // The new promotion must exist before retiring the old one.
                const created = await createPromotionCodeForAdministrator(request.auth, replacement);
                const stripeForReplacement = new Stripe(stripeSecretKey.value());
                try {
                    await stripeForReplacement.promotionCodes.update(oldCode.stripePromotionCodeId, { active: false });
                    await updatePromotionCodeRecord(promotionCodeUid, { active: false, archived: true, status: 'inactive' });
                } catch (retirementError) {
                    // Never leave an untracked replacement redeemable after a failed edit.
                    try {
                        await stripeForReplacement.promotionCodes.update(created.promotionCode.stripePromotionCodeId, { active: false });
                        await updatePromotionCodeRecord(created.promotionCode.uid, { active: false, archived: true, status: 'inactive' });
                    } catch (cleanupError) {
                        console.error('Replacement rollback failed:', cleanupError);
                    }
                    console.error('Could not retire old promotion:', retirementError);
                    throw new HttpsError('internal', 'The replacement was created but the previous code could not be retired. Check Stripe before retrying.');
                }
                return created;
            }

            const requestedActive = request.data.active;
            const requestedName = request.data.name;
            const requestedArchived = request.data.archived;
            if (requestedActive === undefined && requestedName === undefined && requestedArchived === undefined) {
                throw new HttpsError('invalid-argument', 'No changes were supplied.');
            }
            if (requestedActive !== undefined && typeof requestedActive !== 'boolean') {
                throw new HttpsError('invalid-argument', 'Invalid active setting.');
            }
            if (requestedArchived !== undefined && typeof requestedArchived !== 'boolean') {
                throw new HttpsError('invalid-argument', 'Invalid archive setting.');
            }
            if (requestedName !== undefined && (typeof requestedName !== 'string' || !requestedName.trim() || requestedName.trim().length > 80)) {
                throw new HttpsError('invalid-argument', 'The promotion name must contain 1 to 80 characters.');
            }
            if (requestedArchived === false) {
                throw new HttpsError('failed-precondition', 'Archived codes cannot be restored. Create a replacement.');
            }
            if (requestedArchived === true && requestedActive === true) {
                throw new HttpsError('invalid-argument', 'An archived code cannot be active.');
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
                requestedActive === true &&
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

            if (existingPromotionCode.archived) {
                throw new HttpsError('failed-precondition', 'Archived codes cannot be edited or reactivated.');
            }
            const targetActive = requestedArchived === true ? false : (requestedActive ?? existingPromotionCode.active);
            const targetName = requestedName?.trim() ?? existingPromotionCode.name;
            if (existingPromotionCode.active === targetActive && existingPromotionCode.name === targetName && requestedArchived !== true) {
                return { promotionCode: existingPromotionCode };
            }

            const stripe =
                new Stripe(
                    stripeSecretKey.value()
                );

            try {
                const stripePromotionCode = targetActive !== existingPromotionCode.active
                    ? await stripe.promotionCodes.update(existingPromotionCode.stripePromotionCodeId, { active: targetActive })
                    : await stripe.promotionCodes.retrieve(existingPromotionCode.stripePromotionCodeId);
                if (targetName !== existingPromotionCode.name) {
                    await stripe.coupons.update(existingPromotionCode.stripeCouponId, { name: targetName });
                }

                const updatedPromotionCode =
                    await updatePromotionCodeRecord(
                        promotionCodeUid,
                        {
                            name: targetName,
                            archived: requestedArchived === true,
                            active: stripePromotionCode.active,

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