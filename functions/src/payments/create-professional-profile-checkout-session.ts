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
    defineSecret,
    defineString
} from 'firebase-functions/params';

import {
    callableFunctionOptions
} from '../shared/function-options';


if (getApps().length === 0) {
    initializeApp();
}


const stripeSecretKey =
    defineSecret('STRIPE_SECRET_KEY');

const professionalProfilePriceId =
    defineString(
        'STRIPE_PROFESSIONAL_PROFILE_ONETIME_PRICE_ID'
    );

const navStreetAppUrl =
    defineString(
        'NAVSTREET_APP_URL',
        {
            default:
                'http://localhost:4200'
        }
    );


interface CreateProfessionalProfileCheckoutResult {
    checkoutSessionId: string;
    checkoutUrl: string;
}


interface ProfessionalProfileDocument {
    ownerUid?: string;

    email?: string;

    stateSlug?: string;

    subscriptionStatus?: string;
    pendingUpgrade?: { serviceStates?: unknown[]; website?: string; description?: string; logoUrl?: string };

    status?: string;

    stripe?: {
        checkoutSessionId?: string;
        customerId?: string;
        subscriptionId?: string;
        subscriptionStatus?: string;
    };
}


export const createProfessionalProfileCheckoutSession =
    onCall<
        void,
        Promise<CreateProfessionalProfileCheckoutResult>
    >(
        {
            ...callableFunctionOptions,

            secrets: [
                stripeSecretKey
            ]
        },

        async request => {
            const ownerUid =
                request.auth?.uid;

            if (!ownerUid) {
                throw new HttpsError(
                    'unauthenticated',
                    'You must be signed in to purchase a business profile.'
                );
            }

            const firestore =
                getFirestore();

            const professionalQuery =
                await firestore
                    .collection('professionalProfiles')
                    .where(
                        'ownerUid',
                        '==',
                        ownerUid
                    )
                    .limit(2)
                    .get();

            if (professionalQuery.empty) {
                throw new HttpsError(
                    'not-found',
                    'Your professional directory listing could not be found.'
                );
            }

            if (
                professionalQuery.docs.length > 1
            ) {
                console.error(
                    'Multiple professional profiles were found for one account.',
                    {
                        ownerUid,
                        professionalUids:
                            professionalQuery.docs.map(
                                snapshot => snapshot.id
                            )
                    }
                );

                throw new HttpsError(
                    'failed-precondition',
                    'More than one professional listing is associated with this account.'
                );
            }

            const professionalSnapshot =
                professionalQuery.docs[0];

            const professional =
                professionalSnapshot.data() as
                ProfessionalProfileDocument;

            const professionalUid =
                professionalSnapshot.id;

            if (
                professional.ownerUid !==
                ownerUid
            ) {
                throw new HttpsError(
                    'permission-denied',
                    'You do not have permission to manage this professional listing.'
                );
            }

            if (
                professional.status !==
                'active'
            ) {
                throw new HttpsError(
                    'failed-precondition',
                    'This professional listing is not active.'
                );
            }

            if (
                professional.subscriptionStatus ===
                'profile'
            ) {
                throw new HttpsError(
                    'already-exists',
                    'This business already has a Full Business Profile.'
                );
            }

            if (!professional.pendingUpgrade ||
                !Array.isArray(professional.pendingUpgrade.serviceStates) ||
                professional.pendingUpgrade.serviceStates.length < 1 ||
                professional.pendingUpgrade.serviceStates.length > 5 ||
                !professional.pendingUpgrade.website ||
                !professional.pendingUpgrade.description ||
                !professional.pendingUpgrade.logoUrl) {
                throw new HttpsError('failed-precondition',
                    'Complete your enhanced profile and state coverage before checkout.');
            }

            const priceId =
                professionalProfilePriceId
                    .value()
                    .trim();

            if (!priceId) {
                throw new HttpsError(
                    'failed-precondition',
                    'The one-time professional profile price has not been configured.'
                );
            }

            const stripe =
                new Stripe(
                    stripeSecretKey.value()
                );

            // Never charge a recurring price for a one-time entitlement.
            const configuredPrice = await stripe.prices.retrieve(priceId);
            if (!configuredPrice.active || configuredPrice.type !== 'one_time' ||
                configuredPrice.currency !== 'usd' || configuredPrice.unit_amount !== 4900) {
                throw new HttpsError('failed-precondition',
                    'Professional profile price must be an active $49 USD one-time price.');
            }

            const existingCheckoutSessionId =
                professional.stripe
                    ?.checkoutSessionId;

            if (existingCheckoutSessionId) {
                try {
                    const existingSession =
                        await stripe
                            .checkout
                            .sessions
                            .retrieve(
                                existingCheckoutSessionId
                            );

                    if (
                        existingSession.mode === 'payment' &&
                        existingSession.status === 'open' &&
                        existingSession.url
                    ) {
                        if (existingSession.allow_promotion_codes === true) {
                            return {
                                checkoutSessionId: existingSession.id,
                                checkoutUrl: existingSession.url
                            };
                        }
                        await stripe.checkout.sessions.expire(existingSession.id);
                        console.info('Expired outdated professional Checkout session.', {
                            professionalUid,
                            checkoutSessionId: existingSession.id
                        });
                    }

                    if (
                        existingSession.mode === 'payment' &&
                        existingSession.status ===
                        'complete'
                    ) {
                        throw new HttpsError(
                            'already-exists',
                            'The professional one-time Checkout session has already been completed.'
                        );
                    }
                } catch (error) {
                    if (
                        error instanceof HttpsError
                    ) {
                        throw error;
                    }

                    console.error(
                        'The previous professional Checkout session could not be retrieved.',
                        {
                            ownerUid,
                            professionalUid,
                            existingCheckoutSessionId,
                            error
                        }
                    );
                }
            }

            const authenticatedEmail =
                request.auth?.token?.email;

            const customerEmail =
                professional.email?.trim() ||
                (
                    typeof authenticatedEmail ===
                        'string'
                        ? authenticatedEmail.trim()
                        : ''
                );

            const applicationUrl =
                navStreetAppUrl
                    .value()
                    .replace(/\/+$/, '');

            const stateSlug =
                professional.stateSlug?.trim() ||
                'north-carolina';

            try {
                const checkoutSession =
                    await stripe
                        .checkout
                        .sessions
                        .create({
                            mode:
                                'payment',

                            allow_promotion_codes: true,

                            client_reference_id:
                                professionalUid,

                            customer_email:
                                customerEmail ||
                                undefined,

                            line_items: [
                                {
                                    price:
                                        priceId,

                                    quantity:
                                        1
                                }
                            ],

                            metadata: {
                                purchaseType:
                                    'professional_profile_one_time',

                                professionalUid,

                                ownerUid,

                                stateSlug
                            },

                            success_url:
                                `${applicationUrl}` +
                                `/professionals/${stateSlug}` +
                                `/profile/setup` +
                                `?session_id={CHECKOUT_SESSION_ID}`,

                            cancel_url:
                                `${applicationUrl}` +
                                `/professionals/register/${stateSlug}` +
                                `?payment=cancelled`
                        });

                if (!checkoutSession.url) {
                    throw new Error(
                        'Stripe did not return a Checkout URL.'
                    );
                }

                await professionalSnapshot
                    .ref
                    .update({
                        'stripe.checkoutSessionId': checkoutSession.id,
                        'stripe.paymentStatus': 'payment_pending',

                        updatedAt:
                            FieldValue.serverTimestamp()
                    });

                return {
                    checkoutSessionId:
                        checkoutSession.id,

                    checkoutUrl:
                        checkoutSession.url
                };
            } catch (error) {
                console.error(
                    'Professional profile Checkout session creation failed.',
                    {
                        ownerUid,
                        professionalUid,
                        error
                    }
                );

                if (
                    error instanceof HttpsError
                ) {
                    throw error;
                }

                throw new HttpsError(
                    'internal',
                    'The secure one-time payment page could not be opened. Please try again.'
                );
            }
        }
    );