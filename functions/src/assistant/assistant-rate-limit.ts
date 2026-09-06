import {
    createHash
} from 'node:crypto';

import {
    Timestamp
} from 'firebase-admin/firestore';

import {
    HttpsError
} from 'firebase-functions/v2/https';

import {
    adminFirestore
} from '../shared/firebase-admin';

import {
    AssistantRateLimitIdentity,
    AssistantRateLimitResult
} from './assistant-types';

const AUTHENTICATED_HOURLY_LIMIT =
    20;

const AUTHENTICATED_DAILY_LIMIT =
    50;

const ANONYMOUS_HOURLY_LIMIT =
    5;

const ANONYMOUS_DAILY_LIMIT =
    15;

const ONE_HOUR_IN_MILLISECONDS =
    60 * 60 * 1000;

const ONE_DAY_IN_MILLISECONDS =
    24 * 60 * 60 * 1000;

interface AssistantUsageData {
    isAuthenticated: boolean;
    hourlyRequestCount: number;
    dailyRequestCount: number;
    hourlyWindowStartedAt: Timestamp;
    dailyWindowStartedAt: Timestamp;
    lastRequestAt: Timestamp;
}

export function createAssistantRateLimitIdentity(
    authenticatedUserUid:
        string | undefined,
    anonymousSessionUid:
        string | null,
    ipAddress:
        string | undefined
): AssistantRateLimitIdentity {
    if (authenticatedUserUid) {
        return {
            key:
                createHashedKey(
                    `authenticated:${authenticatedUserUid}`
                ),
            isAuthenticated:
                true
        };
    }

    if (!anonymousSessionUid) {
        throw new HttpsError(
            'invalid-argument',
            'An anonymous assistant session is required.'
        );
    }

    const normalizedIpAddress =
        ipAddress?.trim() ||
        'unknown';

    return {
        key:
            createHashedKey(
                [
                    'anonymous',
                    anonymousSessionUid,
                    normalizedIpAddress
                ].join(':')
            ),
        isAuthenticated:
            false
    };
}

export async function enforceAssistantRateLimit(
    identity: AssistantRateLimitIdentity
): Promise<AssistantRateLimitResult> {
    const usageReference =
        adminFirestore
            .collection('assistantUsage')
            .doc(identity.key);

    const hourlyLimit =
        identity.isAuthenticated
            ? AUTHENTICATED_HOURLY_LIMIT
            : ANONYMOUS_HOURLY_LIMIT;

    const dailyLimit =
        identity.isAuthenticated
            ? AUTHENTICATED_DAILY_LIMIT
            : ANONYMOUS_DAILY_LIMIT;

    return adminFirestore.runTransaction(
        async transaction => {
            const timestamp =
                Timestamp.now();

            const usageSnapshot =
                await transaction.get(
                    usageReference
                );

            if (!usageSnapshot.exists) {
                const newUsage:
                    AssistantUsageData = {
                    isAuthenticated:
                        identity.isAuthenticated,
                    hourlyRequestCount:
                        1,
                    dailyRequestCount:
                        1,
                    hourlyWindowStartedAt:
                        timestamp,
                    dailyWindowStartedAt:
                        timestamp,
                    lastRequestAt:
                        timestamp
                };

                transaction.create(
                    usageReference,
                    newUsage
                );

                return {
                    remainingRequests:
                        Math.min(
                            hourlyLimit - 1,
                            dailyLimit - 1
                        ),
                    hourlyRequestCount:
                        1,
                    dailyRequestCount:
                        1
                };
            }

            const usageData:
                Record<string, unknown> =
                usageSnapshot.data() ?? {};

            const hourlyWindowStartedAt =
                getTimestamp(
                    usageData['hourlyWindowStartedAt'],
                    timestamp
                );

            const dailyWindowStartedAt =
                getTimestamp(
                    usageData['dailyWindowStartedAt'],
                    timestamp
                );

            const hourlyWindowExpired =
                hasWindowExpired(
                    hourlyWindowStartedAt,
                    timestamp,
                    ONE_HOUR_IN_MILLISECONDS
                );

            const dailyWindowExpired =
                hasWindowExpired(
                    dailyWindowStartedAt,
                    timestamp,
                    ONE_DAY_IN_MILLISECONDS
                );

            const existingHourlyCount =
                getNonNegativeInteger(
                    usageData['hourlyRequestCount']
                );

            const existingDailyCount =
                getNonNegativeInteger(
                    usageData['dailyRequestCount']
                );

            const hourlyRequestCount =
                hourlyWindowExpired
                    ? 1
                    : existingHourlyCount + 1;

            const dailyRequestCount =
                dailyWindowExpired
                    ? 1
                    : existingDailyCount + 1;

            if (
                hourlyRequestCount >
                hourlyLimit
            ) {
                throw new HttpsError(
                    'resource-exhausted',
                    'You have reached the hourly NavStreet assistant limit. Please try again later.'
                );
            }

            if (
                dailyRequestCount >
                dailyLimit
            ) {
                throw new HttpsError(
                    'resource-exhausted',
                    'You have reached today’s NavStreet assistant limit. Please try again tomorrow.'
                );
            }

            const updatedUsage:
                AssistantUsageData = {
                isAuthenticated:
                    identity.isAuthenticated,
                hourlyRequestCount,
                dailyRequestCount,
                hourlyWindowStartedAt:
                    hourlyWindowExpired
                        ? timestamp
                        : hourlyWindowStartedAt,
                dailyWindowStartedAt:
                    dailyWindowExpired
                        ? timestamp
                        : dailyWindowStartedAt,
                lastRequestAt:
                    timestamp
            };

            transaction.set(
                usageReference,
                updatedUsage
            );

            return {
                remainingRequests:
                    Math.min(
                        hourlyLimit -
                        hourlyRequestCount,
                        dailyLimit -
                        dailyRequestCount
                    ),
                hourlyRequestCount,
                dailyRequestCount
            };
        }
    );
}

function createHashedKey(
    value: string
): string {
    return createHash('sha256')
        .update(value)
        .digest('hex');
}

function getTimestamp(
    value: unknown,
    fallback: Timestamp
): Timestamp {
    return value instanceof Timestamp
        ? value
        : fallback;
}

function getNonNegativeInteger(
    value: unknown
): number {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= 0
    )
        ? value
        : 0;
}

function hasWindowExpired(
    windowStartedAt: Timestamp,
    currentTimestamp: Timestamp,
    durationInMilliseconds: number
): boolean {
    return (
        currentTimestamp.toMillis() -
        windowStartedAt.toMillis()
    ) >= durationInMilliseconds;
}