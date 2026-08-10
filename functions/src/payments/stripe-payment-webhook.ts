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
    onRequest
} from 'firebase-functions/v2/https';

import {
    defineSecret
} from 'firebase-functions/params';


if (getApps().length === 0) {
    initializeApp();
}


const stripeSecretKey =
    defineSecret('STRIPE_SECRET_KEY');

const stripeWebhookSecret =
    defineSecret('STRIPE_WEBHOOK_SECRET');


interface ListingDraftDocument {
    sellerUid?: string;

    address?: {
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        zipCode?: string;
        county?: string;
    };

    propertyDetails?: {
        propertyType?: string;
        bedrooms?: number;
        fullBathrooms?: number;
        halfBathrooms?: number;
        squareFeet?: number;
        lotSize?: number;
        yearBuilt?: number;
        description?: string;

        hoa?: {
            hasHoa?: boolean;
            feeAmount?: number;
            feeFrequency?: string;
        };
    };

    features?: Record<string, boolean>;

    photos?: Array<Record<string, unknown>>;

    primaryPhotoUrl?: string;
    photoUrls?: string[];

    pricing?: {
        listPrice?: number;
    };

    featuredListing?: boolean;

    promotion?: Record<string, unknown>;

    certification?: {
        accepted?: boolean;
        acceptedAt?: unknown;
    };

    progress?: {
        contentStatus?: string;
    };

    publication?: {
        status?: string;
        identityStatus?: string;
        paymentStatus?: string;
        stripeCheckoutSessionId?: string;
        publishedListingUid?: string;
    };

    createdAt?: unknown;
}


export const stripePaymentWebhook =
    onRequest(
        {
            secrets: [
                stripeSecretKey,
                stripeWebhookSecret
            ]
        },

        async (request, response) => {
            if (request.method !== 'POST') {
                response
                    .status(405)
                    .send('Method Not Allowed');

                return;
            }

            const signature =
                request.headers['stripe-signature'];

            if (!signature) {
                response
                    .status(400)
                    .send('Missing Stripe signature.');

                return;
            }

            const stripe =
                new Stripe(
                    stripeSecretKey.value()
                );

            let event: Stripe.Event;

            try {
                event =
                    stripe.webhooks.constructEvent(
                        request.rawBody,
                        signature,
                        stripeWebhookSecret.value()
                    );
            } catch (error) {
                console.error(
                    'Stripe webhook signature verification failed.',
                    error
                );

                response
                    .status(400)
                    .send('Invalid Stripe signature.');

                return;
            }

            try {
                if (
                    event.type ===
                    'checkout.session.completed' ||
                    event.type ===
                    'checkout.session.async_payment_succeeded'
                ) {
                    const checkoutSession =
                        event.data.object as
                        Stripe.Checkout.Session;

                    await publishPaidListing(
                        checkoutSession
                    );
                }

                if (
                    event.type ===
                    'checkout.session.async_payment_failed'
                ) {
                    const checkoutSession =
                        event.data.object as
                        Stripe.Checkout.Session;

                    await markPaymentFailed(
                        checkoutSession
                    );
                }

                response.status(200).json({
                    received: true
                });
            } catch (error) {
                console.error(
                    'Stripe webhook processing failed.',
                    {
                        eventId: event.id,
                        eventType: event.type,
                        error
                    }
                );

                response
                    .status(500)
                    .send('Webhook processing failed.');
            }
        }
    );


async function publishPaidListing(
    checkoutSession: Stripe.Checkout.Session
): Promise<void> {
    if (
        checkoutSession.payment_status !== 'paid'
    ) {
        console.log(
            'Checkout completed without paid status.',
            {
                checkoutSessionId:
                    checkoutSession.id,

                paymentStatus:
                    checkoutSession.payment_status
            }
        );

        return;
    }

    const listingUid =
        checkoutSession.metadata
            ?.listingUid
            ?.trim();

    const sellerUid =
        checkoutSession.metadata
            ?.sellerUid
            ?.trim();

    if (!listingUid || !sellerUid) {
        throw new Error(
            'Stripe Checkout metadata is missing the listing or seller UID.'
        );
    }

    const firestore =
        getFirestore();

    const draftReference =
        firestore
            .collection('listingDrafts')
            .doc(listingUid);

    const listingReference =
        firestore
            .collection('listings')
            .doc(listingUid);

    await firestore.runTransaction(
        async transaction => {
            const draftSnapshot =
                await transaction.get(
                    draftReference
                );

            if (!draftSnapshot.exists) {
                throw new Error(
                    `Listing draft ${listingUid} was not found.`
                );
            }

            const draft =
                draftSnapshot.data() as
                ListingDraftDocument;

            if (draft.sellerUid !== sellerUid) {
                throw new Error(
                    'Stripe seller metadata does not match the listing owner.'
                );
            }

            const storedCheckoutSessionId =
                draft.publication
                    ?.stripeCheckoutSessionId;

            if (
                storedCheckoutSessionId &&
                storedCheckoutSessionId !==
                checkoutSession.id
            ) {
                throw new Error(
                    'Stripe Checkout Session does not match the listing draft.'
                );
            }

            if (
                draft.publication?.status ===
                'published' &&
                draft.publication
                    ?.publishedListingUid ===
                listingUid
            ) {
                return;
            }

            validateDraftForPublication(
                draft,
                listingUid
            );

            const now =
                FieldValue.serverTimestamp();

            const paymentIntentId =
                typeof checkoutSession
                    .payment_intent === 'string'
                    ? checkoutSession
                        .payment_intent
                    : checkoutSession
                        .payment_intent?.id;

            const listingDocument:
                Record<string, unknown> = {
                Uid: listingUid,
                sellerUid,

                addressLine1:
                    draft.address!.addressLine1!,

                city:
                    draft.address!.city!,

                state:
                    draft.address!.state!,

                zipCode:
                    draft.address!.zipCode!,

                county:
                    draft.address!.county!,

                listPrice:
                    draft.pricing!.listPrice!,

                propertyType:
                    draft.propertyDetails!
                        .propertyType!,

                bedrooms:
                    draft.propertyDetails!
                        .bedrooms!,

                bathrooms:
                    draft.propertyDetails!
                        .fullBathrooms! +
                    (
                        draft.propertyDetails!
                            .halfBathrooms! * 0.5
                    ),

                squareFeet:
                    draft.propertyDetails!
                        .squareFeet!,

                features:
                    draft.features ?? {},

                photos:
                    draft.photos ?? [],

                photoUrls:
                    draft.photoUrls ?? [],

                featuredListing:
                    draft.featuredListing === true,

                certification:
                    draft.certification!,

                workflow: {
                    identityVerified: true,
                    paymentCompleted: true,
                    published: true
                },

                status: 'active',
                completionPercent: 100,
                daysOnMarket: 0,
                views: 0,
                favorites: 0,

                publishedAt: now,
                createdAt:
                    draft.createdAt ?? now,
                updatedAt: now
            };

            addOptionalField(
                listingDocument,
                'addressLine2',
                draft.address?.addressLine2
            );

            addOptionalField(
                listingDocument,
                'lotSize',
                draft.propertyDetails?.lotSize
            );

            addOptionalField(
                listingDocument,
                'yearBuilt',
                draft.propertyDetails?.yearBuilt
            );

            addOptionalField(
                listingDocument,
                'description',
                draft.propertyDetails?.description
            );

            addOptionalField(
                listingDocument,
                'hoa',
                draft.propertyDetails?.hoa
            );

            addOptionalField(
                listingDocument,
                'primaryPhotoUrl',
                draft.primaryPhotoUrl
            );

            addOptionalField(
                listingDocument,
                'promotion',
                draft.promotion
            );

            transaction.set(
                listingReference,
                listingDocument
            );

            const draftUpdates:
                Record<string, unknown> = {
                'publication.status':
                    'published',

                'publication.paymentStatus':
                    'paid',

                'publication.stripeCheckoutSessionId':
                    checkoutSession.id,

                'publication.paymentAmount':
                    (
                        checkoutSession
                            .amount_total ?? 0
                    ) / 100,

                'publication.paidAt':
                    now,

                'publication.publishedListingUid':
                    listingUid,

                'publication.publishedAt':
                    now,

                updatedAt:
                    now,

                lastSavedAt:
                    now
            };

            if (paymentIntentId) {
                draftUpdates[
                    'publication.stripePaymentIntentId'
                ] = paymentIntentId;
            }

            transaction.update(
                draftReference,
                draftUpdates
            );
        }
    );

    console.log(
        'Paid listing published successfully.',
        {
            listingUid,
            sellerUid,
            checkoutSessionId:
                checkoutSession.id
        }
    );
}


async function markPaymentFailed(
    checkoutSession: Stripe.Checkout.Session
): Promise<void> {
    const listingUid =
        checkoutSession.metadata
            ?.listingUid
            ?.trim();

    const sellerUid =
        checkoutSession.metadata
            ?.sellerUid
            ?.trim();

    if (!listingUid || !sellerUid) {
        return;
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
        return;
    }

    const draft =
        draftSnapshot.data() as
        ListingDraftDocument;

    if (draft.sellerUid !== sellerUid) {
        throw new Error(
            'Stripe seller metadata does not match the listing owner.'
        );
    }

    if (
        draft.publication
            ?.stripeCheckoutSessionId !==
        checkoutSession.id
    ) {
        return;
    }

    await draftReference.update({
        'publication.status':
            'payment_failed',

        'publication.paymentStatus':
            'failed',

        updatedAt:
            FieldValue.serverTimestamp(),

        lastSavedAt:
            FieldValue.serverTimestamp()
    });
}


function validateDraftForPublication(
    draft: ListingDraftDocument,
    listingUid: string
): void {
    if (
        draft.progress?.contentStatus !==
        'complete'
    ) {
        throw new Error(
            `Listing draft ${listingUid} is not complete.`
        );
    }

    if (
        draft.publication?.identityStatus !==
        'verified'
    ) {
        throw new Error(
            `Listing draft ${listingUid} has not completed identity verification.`
        );
    }

    if (
        draft.certification?.accepted !== true
    ) {
        throw new Error(
            `Listing draft ${listingUid} has not accepted seller certification.`
        );
    }

    if (
        !draft.address?.addressLine1 ||
        !draft.address.city ||
        !draft.address.state ||
        !draft.address.zipCode ||
        !draft.address.county
    ) {
        throw new Error(
            `Listing draft ${listingUid} has an incomplete address.`
        );
    }

    if (
        !draft.propertyDetails?.propertyType ||
        draft.propertyDetails.bedrooms ===
        undefined ||
        draft.propertyDetails.fullBathrooms ===
        undefined ||
        draft.propertyDetails.halfBathrooms ===
        undefined ||
        draft.propertyDetails.squareFeet ===
        undefined
    ) {
        throw new Error(
            `Listing draft ${listingUid} has incomplete property details.`
        );
    }

    if (
        draft.pricing?.listPrice ===
        undefined
    ) {
        throw new Error(
            `Listing draft ${listingUid} has no listing price.`
        );
    }
}


function addOptionalField(
    target: Record<string, unknown>,
    fieldName: string,
    value: unknown
): void {
    if (
        value !== undefined &&
        value !== null &&
        value !== ''
    ) {
        target[fieldName] = value;
    }
}