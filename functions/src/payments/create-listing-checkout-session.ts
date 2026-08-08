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


if (getApps().length === 0) {
    initializeApp();
}


const stripeSecretKey =
    defineSecret('STRIPE_SECRET_KEY');

const DEVELOPMENT_SITE_URL =
    'http://localhost:4200';

const LISTING_FEE_CENTS = 4900;
const FEATURED_LISTING_FEE_CENTS = 1000;


interface CreateListingCheckoutSessionRequest {
    listingUid: string;
}


interface CreateListingCheckoutSessionResult {
    checkoutSessionId: string;
    checkoutUrl: string;
    totalAmount: number;
}


interface ListingDraftDocument {
    sellerUid?: string;

    featuredListing?: boolean;

    promotion?: {
        code?: string;
        discountAmount?: number;
    };

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
                request.data.listingUid?.trim();

            if (!listingUid) {
                throw new HttpsError(
                    'invalid-argument',
                    'A listing draft is required.'
                );
            }

            const firestore =
                getFirestore();

            const draftReference =
                firestore
                    .collection('listingDrafts')
                    .doc(listingUid);

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

            if (draft.sellerUid !== sellerUid) {
                throw new HttpsError(
                    'permission-denied',
                    'You do not have permission to pay for this listing.'
                );
            }

            if (
                draft.progress?.contentStatus !==
                'complete'
            ) {
                throw new HttpsError(
                    'failed-precondition',
                    'Complete the listing before continuing to payment.'
                );
            }

            if (
                draft.certification?.accepted !==
                true
            ) {
                throw new HttpsError(
                    'failed-precondition',
                    'Seller certification must be accepted before continuing to payment.'
                );
            }

            if (
                draft.publication?.identityStatus !==
                'verified'
            ) {
                throw new HttpsError(
                    'failed-precondition',
                    'Identity verification must be completed before payment.'
                );
            }

            if (
                draft.publication?.paymentStatus ===
                'paid'
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

            const existingCheckoutSessionId =
                draft.publication
                    ?.stripeCheckoutSessionId;

            if (existingCheckoutSessionId) {
                try {
                    const existingSession =
                        await stripe.checkout.sessions.retrieve(
                            existingCheckoutSessionId
                        );

                    if (
                        existingSession.status === 'open' &&
                        existingSession.url
                    ) {
                        return {
                            checkoutSessionId:
                                existingSession.id,

                            checkoutUrl:
                                existingSession.url,

                            totalAmount:
                                existingSession.amount_total ?? 0
                        };
                    }

                    if (
                        existingSession.payment_status ===
                        'paid'
                    ) {
                        throw new HttpsError(
                            'already-exists',
                            'Payment has already been completed for this listing.'
                        );
                    }
                } catch (error) {
                    if (error instanceof HttpsError) {
                        throw error;
                    }

                    console.error(
                        'The existing Stripe Checkout session could not be retrieved.',
                        {
                            listingUid,
                            sellerUid,
                            existingCheckoutSessionId,
                            error
                        }
                    );
                }
            }

            const featuredListingFee =
                draft.featuredListing
                    ? FEATURED_LISTING_FEE_CENTS
                    : 0;

            const subtotal =
                LISTING_FEE_CENTS +
                featuredListingFee;

            const requestedDiscount =
                Math.round(
                    Math.max(
                        draft.promotion?.discountAmount ?? 0,
                        0
                    ) * 100
                );

            const discountAmount =
                Math.min(
                    requestedDiscount,
                    subtotal
                );

            const totalAmount =
                subtotal -
                discountAmount;

            if (totalAmount < 50) {
                throw new HttpsError(
                    'failed-precondition',
                    'The payment total is too low for Stripe Checkout.'
                );
            }

            const descriptionParts = [
                'NavStreet property listing'
            ];

            if (draft.featuredListing) {
                descriptionParts.push(
                    'Featured Listing upgrade'
                );
            }

            if (
                draft.promotion?.code &&
                discountAmount > 0
            ) {
                descriptionParts.push(
                    `Promotion: ${draft.promotion.code}`
                );
            }

            try {
                const checkoutSession =
                    await stripe.checkout.sessions.create({
                        mode: 'payment',

                        customer_email:
                            request.auth?.token?.email
                                ? String(
                                    request.auth.token.email
                                )
                                : undefined,

                        client_reference_id:
                            listingUid,

                        line_items: [
                            {
                                quantity: 1,

                                price_data: {
                                    currency: 'usd',

                                    unit_amount:
                                        totalAmount,

                                    product_data: {
                                        name:
                                            'NavStreet Listing Publication',

                                        description:
                                            descriptionParts.join(' • ')
                                    }
                                }
                            }
                        ],

                        metadata: {
                            listingUid,
                            sellerUid,

                            listingFeeCents:
                                String(
                                    LISTING_FEE_CENTS
                                ),

                            featuredListingFeeCents:
                                String(
                                    featuredListingFee
                                ),

                            discountAmountCents:
                                String(
                                    discountAmount
                                ),

                            totalAmountCents:
                                String(
                                    totalAmount
                                ),

                            promotionCode:
                                draft.promotion?.code ?? ''
                        },

                        payment_intent_data: {
                            metadata: {
                                listingUid,
                                sellerUid
                            }
                        },

                        success_url:
                            `${DEVELOPMENT_SITE_URL}` +
                            `/sell/listings/${listingUid}` +
                            `/payment-return` +
                            `?session_id={CHECKOUT_SESSION_ID}`,

                        cancel_url:
                            `${DEVELOPMENT_SITE_URL}` +
                            `/sell/listings/${listingUid}` +
                            `/payment?payment=cancelled`
                    });

                if (!checkoutSession.url) {
                    throw new Error(
                        'Stripe did not return a Checkout URL.'
                    );
                }

                await draftReference.update({
                    'publication.status':
                        'payment_processing',

                    'publication.paymentStatus':
                        'pending',

                    'publication.stripeCheckoutSessionId':
                        checkoutSession.id,

                    'publication.paymentAmount':
                        totalAmount / 100,

                    'publication.paymentBreakdown': {
                        listingFee:
                            LISTING_FEE_CENTS / 100,

                        featuredListingFee:
                            featuredListingFee / 100,

                        discountAmount:
                            discountAmount / 100,

                        totalAmount:
                            totalAmount / 100,

                        promotionCode:
                            draft.promotion?.code ?? null
                    },

                    'publication.checkoutCreatedAt':
                        FieldValue.serverTimestamp(),

                    updatedAt:
                        FieldValue.serverTimestamp(),

                    lastSavedAt:
                        FieldValue.serverTimestamp()
                });

                return {
                    checkoutSessionId:
                        checkoutSession.id,

                    checkoutUrl:
                        checkoutSession.url,

                    totalAmount
                };
            } catch (error) {
                console.error(
                    'Stripe Checkout session creation failed.',
                    {
                        listingUid,
                        sellerUid,
                        error
                    }
                );

                if (error instanceof HttpsError) {
                    throw error;
                }

                throw new HttpsError(
                    'internal',
                    'The secure payment page could not be opened. Please try again.'
                );
            }
        }
    );