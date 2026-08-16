import * as logger from 'firebase-functions/logger';

import {
    onDocumentUpdated,
} from 'firebase-functions/v2/firestore';

import {
    FieldValue,
} from 'firebase-admin/firestore';

import {
    SENDGRID_API_KEY,
} from '../authentication/otp/otp-config';

import {
    adminAuth,
    adminFirestore,
} from '../shared/firebase-admin';

import {
    FUNCTION_REGION,
} from '../shared/function-options';

import {
    NAVSTREET_APP_URL,
} from './showing-notification-config';

import {
    SellerBuyerShowingResponseEmailKind,
    sendSellerBuyerShowingResponseEmail,
} from './showing-email.service';

/**
 * Notifies the seller when a buyer accepts or declines
 * a proposed alternate showing time.
 */
export const notifySellerOfBuyerShowingResponse =
    onDocumentUpdated(
        {
            document:
                'showingRequests/{showingRequestUid}',

            region:
                FUNCTION_REGION,

            secrets: [
                SENDGRID_API_KEY,
            ],
        },

        async event => {
            const beforeSnapshot =
                event.data?.before;

            const afterSnapshot =
                event.data?.after;

            if (
                !beforeSnapshot ||
                !afterSnapshot
            ) {
                return;
            }

            const beforeData =
                beforeSnapshot.data();

            const afterData =
                afterSnapshot.data();

            const previousStatus =
                readString(
                    beforeData['status'],
                );

            const currentStatus =
                readString(
                    afterData['status'],
                );

            /*
             * This notification applies only when a buyer
             * responds to a seller-proposed alternate time.
             */
            if (
                previousStatus !==
                'alternate_proposed' ||
                (
                    currentStatus !== 'confirmed' &&
                    currentStatus !== 'cancelled'
                )
            ) {
                return;
            }

            const response =
                getSellerNotificationResponse(
                    currentStatus,
                );

            const statusHistory =
                readArray(
                    afterData['statusHistory'],
                );

            const latestHistoryEntry =
                readRecord(
                    statusHistory[
                    statusHistory.length - 1
                    ],
                );

            /*
             * Confirm that the status transition was made by
             * the buyer rather than another seller action.
             */
            if (
                readString(
                    latestHistoryEntry['changedBy'],
                ) !== 'buyer' ||
                readString(
                    latestHistoryEntry['status'],
                ) !== currentStatus
            ) {
                return;
            }

            const showingRequestUid =
                event.params[
                'showingRequestUid'
                ];

            const requestReference =
                adminFirestore
                    .collection('showingRequests')
                    .doc(showingRequestUid);

            /*
             * Re-read the current document so retried events
             * cannot resend a notification already recorded.
             */
            const currentSnapshot =
                await requestReference.get();

            if (!currentSnapshot.exists) {
                return;
            }

            const currentData =
                currentSnapshot.data() ?? {};

            if (
                readString(
                    currentData['status'],
                ) !== currentStatus
            ) {
                return;
            }

            const existingNotification =
                readRecord(
                    currentData[
                    'sellerBuyerResponseNotification'
                    ],
                );

            if (
                readString(
                    existingNotification['response'],
                ) === response
            ) {
                logger.info(
                    'Seller buyer-response email already sent.',
                    {
                        showingRequestUid,
                        response,
                    },
                );

                return;
            }

            const sellerUid =
                readString(
                    currentData['sellerUid'],
                );

            const buyerUid =
                readString(
                    currentData['buyerUid'],
                );

            if (!sellerUid) {
                logger.warn(
                    'Showing request has no seller UID.',
                    {
                        showingRequestUid,
                    },
                );

                return;
            }

            const sellerRecord =
                await adminAuth.getUser(
                    sellerUid,
                );

            const sellerEmail =
                readString(
                    sellerRecord.email,
                );

            if (!sellerEmail) {
                logger.warn(
                    'Showing seller has no email address.',
                    {
                        showingRequestUid,
                        sellerUid,
                    },
                );

                return;
            }

            const sellerProfileSnapshot =
                await adminFirestore
                    .collection('users')
                    .doc(sellerUid)
                    .get();

            const sellerName =
                getSellerName(
                    sellerProfileSnapshot.data(),
                    sellerRecord.displayName,
                );
            const buyerContact =
                readRecord(
                    currentData['buyerContact'],
                );

            const buyerName =
                createPersonName(
                    readString(
                        buyerContact['firstName'],
                    ),
                    readString(
                        buyerContact['lastName'],
                    ),
                ) || 'The buyer';

            const alternateTime =
                readRecord(
                    currentData['alternateTime'],
                );

            const propertyAddress =
                createPropertyAddress(
                    currentData,
                );

            const listingUid =
                readString(
                    currentData['listingUid'],
                );

            const showingReferenceNumber =
                readString(
                    currentData[
                    'showingReferenceNumber'
                    ],
                ) || showingRequestUid;

            const actionUrl =
                createSellerShowingRequestUrl(
                    listingUid,
                    showingRequestUid,
                );

            try {
                await sendSellerBuyerShowingResponseEmail({
                    sellerEmail,
                    sellerName,
                    response,
                    buyerName,
                    propertyAddress,

                    appointmentDate:
                        formatDate(
                            readString(
                                alternateTime['date'],
                            ),
                        ),

                    appointmentStartTime:
                        formatTime(
                            readString(
                                alternateTime[
                                'startTime'
                                ],
                            ),
                        ),

                    appointmentEndTime:
                        formatTime(
                            readString(
                                alternateTime[
                                'endTime'
                                ],
                            ),
                        ),

                    appointmentTimeZone:
                        readString(
                            alternateTime[
                            'timeZone'
                            ],
                        ),

                    showingReferenceNumber,
                    actionUrl,
                });

                await requestReference.update({
                    sellerBuyerResponseNotification: {
                        response,

                        status:
                            currentStatus,

                        sentAt:
                            FieldValue.serverTimestamp(),

                        eventId:
                            event.id,

                        recipientEmail:
                            sellerEmail,

                        buyerUid,
                    },

                    updatedAt:
                        FieldValue.serverTimestamp(),
                });

                logger.info(
                    'Seller buyer-response email sent.',
                    {
                        showingRequestUid,
                        listingUid,
                        sellerUid,
                        buyerUid,
                        response,
                    },
                );
            } catch (error: unknown) {
                logger.error(
                    'Unable to send seller buyer-response email.',
                    {
                        showingRequestUid,
                        listingUid,
                        sellerUid,
                        buyerUid,
                        response,
                        error,
                    },
                );

                throw error;
            }
        },
    );

function getSellerNotificationResponse(
    status: string,
): SellerBuyerShowingResponseEmailKind {
    return status === 'confirmed'
        ? 'accepted'
        : 'declined';
}

function createSellerShowingRequestUrl(
    listingUid: string,
    showingRequestUid: string,
): string {
    const applicationUrl =
        NAVSTREET_APP_URL
            .value()
            .replace(/\/+$/, '');

    return (
        `${applicationUrl}` +
        '/sell/listings/' +
        `${encodeURIComponent(listingUid)}` +
        '/showing-requests/' +
        `${encodeURIComponent(showingRequestUid)}`
    );
}

function createPropertyAddress(
    data: Record<string, unknown>,
): string {
    const addressLine =
        readString(
            data['propertyAddress'],
        );

    const city =
        readString(
            data['propertyCity'],
        );

    const state =
        readString(
            data['propertyState'],
        );

    const zipCode =
        readString(
            data['propertyZipCode'],
        );

    const cityAndState = [
        city,
        state,
    ]
        .filter(Boolean)
        .join(', ');

    return [
        addressLine,
        cityAndState,
        zipCode,
    ]
        .filter(Boolean)
        .join(' ');
}

function getSellerName(
    profile:
        Record<string, unknown> |
        undefined,
    authenticationDisplayName:
        string | undefined,
): string {
    if (profile) {
        const firstName =
            readString(
                profile['firstName'],
            );

        const lastName =
            readString(
                profile['lastName'],
            );

        const fullName =
            [
                firstName,
                lastName,
            ]
                .filter(Boolean)
                .join(' ');

        if (fullName) {
            return fullName;
        }

        const displayName =
            readString(
                profile['displayName'],
            );

        if (displayName) {
            return displayName;
        }
    }

    return (
        authenticationDisplayName
            ?.trim() ||
        'NavStreet seller'
    );
}

function createPersonName(
    firstName: string,
    lastName: string,
): string {
    return [
        firstName,
        lastName,
    ]
        .filter(Boolean)
        .join(' ');
}

function formatDate(
    date: string,
): string {
    const parsedDate =
        new Date(`${date}T12:00:00`);

    if (
        !date ||
        Number.isNaN(
            parsedDate.getTime(),
        )
    ) {
        return date;
    }

    return new Intl.DateTimeFormat(
        'en-US',
        {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        },
    ).format(parsedDate);
}

function formatTime(
    time: string,
): string {
    const [
        hourValue,
        minuteValue,
    ] = time
        .split(':')
        .map(Number);

    if (
        !Number.isFinite(hourValue) ||
        !Number.isFinite(minuteValue)
    ) {
        return time;
    }

    const date =
        new Date();

    date.setHours(
        hourValue,
        minuteValue,
        0,
        0,
    );

    return new Intl.DateTimeFormat(
        'en-US',
        {
            hour: 'numeric',
            minute: '2-digit',
        },
    ).format(date);
}

function readArray(
    value: unknown,
): unknown[] {
    return Array.isArray(value)
        ? value
        : [];
}

function readRecord(
    value: unknown,
): Record<string, unknown> {
    return isRecord(value)
        ? value
        : {};
}

function readString(
    value: unknown,
): string {
    return typeof value === 'string'
        ? value.trim()
        : '';
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
}