import {
  Timestamp
} from 'firebase-admin/firestore';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  adminFirestore
} from '../shared/firebase-admin';

import {
  callableFunctionOptions
} from '../shared/function-options';

interface AdministrationSubscription {
  professionalUid: string;
  ownerUid: string;

  businessName: string;
  email: string;
  stateName: string;
  stateAbbreviation: string;

  profileStatus:
    | 'free'
    | 'profile';

  businessStatus:
    | 'active'
    | 'suspended'
    | 'removed';

  stripeSubscriptionStatus: string;

  stripeCheckoutSessionId:
    string | null;

  stripeCustomerId:
    string | null;

  stripeSubscriptionId:
    string | null;

  cancelAtPeriodEnd: boolean;

  activatedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface AdministrationSubscriptionSummary {
  totalSubscriptionRecords: number;
  activeSubscriptions: number;
  trialingSubscriptions: number;
  pastDueSubscriptions: number;
  canceledSubscriptions: number;
  incompleteSubscriptions: number;
  cancelScheduledSubscriptions: number;
}

interface GetAdministrationSubscriptionsResult {
  subscriptions:
    AdministrationSubscription[];

  summary:
    AdministrationSubscriptionSummary;
}

const PROFESSIONAL_COLLECTION =
  'professionalProfiles';

const MAXIMUM_SUBSCRIPTION_RESULTS =
  500;

export const getAdministrationSubscriptions =
  onCall<
    void,
    Promise<GetAdministrationSubscriptionsResult>
  >(
    {
      ...callableFunctionOptions
    },
    async request => {
      requireAdministrator(
        request.auth?.token
      );

      try {
        const snapshot =
          await adminFirestore
            .collection(
              PROFESSIONAL_COLLECTION
            )
            .orderBy(
              'updatedAt',
              'desc'
            )
            .limit(
              MAXIMUM_SUBSCRIPTION_RESULTS
            )
            .get();

        const subscriptions =
          snapshot.docs
            .map(
              documentSnapshot => {
                const data =
                  documentSnapshot.data();

                const stripe =
                  isRecord(
                    data['stripe']
                  )
                    ? data['stripe']
                    : {};

                const stripeSubscriptionStatus =
                  readString(
                    stripe[
                      'subscriptionStatus'
                    ]
                  );

                const checkoutSessionId =
                  readNullableString(
                    stripe[
                      'checkoutSessionId'
                    ]
                  );

                const subscriptionId =
                  readNullableString(
                    stripe[
                      'subscriptionId'
                    ]
                  );

                /*
                 * Do not include free directory records
                 * that have never started a Stripe
                 * subscription or Checkout session.
                 */
                if (
                  !stripeSubscriptionStatus &&
                  !checkoutSessionId &&
                  !subscriptionId
                ) {
                  return null;
                }

                return {
                  professionalUid:
                    documentSnapshot.id,

                  ownerUid:
                    readString(
                      data['ownerUid']
                    ),

                  businessName:
                    readString(
                      data['businessName']
                    ) ||
                    'Unnamed business',

                  email:
                    readString(
                      data['email']
                    ),

                  stateName:
                    readString(
                      data['stateName']
                    ),

                  stateAbbreviation:
                    readString(
                      data[
                        'stateAbbreviation'
                      ]
                    ),

                  profileStatus:
                    data[
                      'subscriptionStatus'
                    ] === 'profile'
                      ? 'profile'
                      : 'free',

                  businessStatus:
                    readBusinessStatus(
                      data['status']
                    ),

                  stripeSubscriptionStatus:
                    stripeSubscriptionStatus ||
                    'checkout_pending',

                  stripeCheckoutSessionId:
                    checkoutSessionId,

                  stripeCustomerId:
                    readNullableString(
                      stripe['customerId']
                    ),

                  stripeSubscriptionId:
                    subscriptionId,

                  cancelAtPeriodEnd:
                    stripe[
                      'cancelAtPeriodEnd'
                    ] === true,

                  activatedAt:
                    serializeDate(
                      stripe['activatedAt']
                    ),

                  createdAt:
                    serializeDate(
                      data['createdAt']
                    ),

                  updatedAt:
                    serializeDate(
                      data['updatedAt']
                    )
                } satisfies AdministrationSubscription;
              }
            )
            .filter(
              (
                subscription
              ): subscription is AdministrationSubscription =>
                subscription !== null
            );

        return {
          subscriptions,

          summary: {
            totalSubscriptionRecords:
              subscriptions.length,

            activeSubscriptions:
              countStatus(
                subscriptions,
                'active'
              ),

            trialingSubscriptions:
              countStatus(
                subscriptions,
                'trialing'
              ),

            pastDueSubscriptions:
              countStatus(
                subscriptions,
                'past_due'
              ),

            canceledSubscriptions:
              subscriptions.filter(
                subscription =>
                  [
                    'canceled',
                    'incomplete_expired',
                    'unpaid'
                  ].includes(
                    subscription
                      .stripeSubscriptionStatus
                  )
              ).length,

            incompleteSubscriptions:
              subscriptions.filter(
                subscription =>
                  [
                    'incomplete',
                    'checkout_pending',
                    'checkout_failed'
                  ].includes(
                    subscription
                      .stripeSubscriptionStatus
                  )
              ).length,

            cancelScheduledSubscriptions:
              subscriptions.filter(
                subscription =>
                  subscription
                    .cancelAtPeriodEnd
              ).length
          }
        };

      } catch (error: unknown) {
        if (
          error instanceof HttpsError
        ) {
          throw error;
        }

        console.error(
          'Unable to load administration subscriptions:',
          error
        );

        throw new HttpsError(
          'internal',
          'NavStreet subscription records could not be loaded.'
        );
      }
    }
  );

function requireAdministrator(
  token:
    | Record<string, unknown>
    | undefined
): void {
  if (!token) {
    throw new HttpsError(
      'unauthenticated',
      'You must be signed in to access administration.'
    );
  }

  const isAdministrator =
    token['admin'] === true ||
    token['role'] === 'admin';

  if (!isAdministrator) {
    throw new HttpsError(
      'permission-denied',
      'Administrator access is required.'
    );
  }
}

function countStatus(
  subscriptions:
    AdministrationSubscription[],
  status: string
): number {
  return subscriptions.filter(
    subscription =>
      subscription
        .stripeSubscriptionStatus ===
      status
  ).length;
}

function readBusinessStatus(
  value: unknown
):
  | 'active'
  | 'suspended'
  | 'removed' {
  switch (value) {
    case 'suspended':
    case 'removed':
      return value;

    default:
      return 'active';
  }
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function readString(
  value: unknown
): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
}

function readNullableString(
  value: unknown
): string | null {
  const normalizedValue =
    readString(value);

  return normalizedValue || null;
}

function serializeDate(
  value: unknown
): string | null {
  if (
    value instanceof Timestamp
  ) {
    return value
      .toDate()
      .toISOString();
  }

  if (
    value instanceof Date
  ) {
    return value.toISOString();
  }

  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    const parsedDate =
      new Date(value);

    if (
      !Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return parsedDate.toISOString();
    }
  }

  return null;
}