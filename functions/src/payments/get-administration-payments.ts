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

type AdministrationPaymentStatus =
  | 'pending'
  | 'paid'
  | 'no_payment_required'
  | 'failed'
  | 'unknown';

interface AdministrationPaymentBreakdown {
  listingFee: number;
  featuredListingFee: number;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;

  promotionCode: string | null;
  promotionCodeUid: string | null;
  stripePromotionCodeId: string | null;
}

interface AdministrationPayment {
  listingUid: string;
  publishedListingUid: string | null;
  sellerUid: string;

  propertyAddress: string;

  featuredListing: boolean;

  status:
    AdministrationPaymentStatus;

  stripePaymentStatus: string | null;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;

  breakdown:
    AdministrationPaymentBreakdown;

  checkoutCreatedAt: string | null;
  paidAt: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
}

interface AdministrationPaymentSummary {
  totalTransactions: number;
  paidTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  noPaymentRequiredTransactions: number;

  grossAmount: number;
  discountAmount: number;
  collectedAmount: number;
}

interface GetAdministrationPaymentsResult {
  payments: AdministrationPayment[];

  summary:
    AdministrationPaymentSummary;
}

const LISTING_DRAFT_COLLECTION =
  'listingDrafts';

const MAXIMUM_PAYMENT_RESULTS =
  1000;

export const getAdministrationPayments =
  onCall<
    void,
    Promise<GetAdministrationPaymentsResult>
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
              LISTING_DRAFT_COLLECTION
            )
            .orderBy(
              'updatedAt',
              'desc'
            )
            .limit(
              MAXIMUM_PAYMENT_RESULTS
            )
            .get();

        const payments =
          snapshot.docs
            .map(
              documentSnapshot => {
                const data =
                  documentSnapshot.data();

                const publication =
                  isRecord(
                    data['publication']
                  )
                    ? data['publication']
                    : {};

                const checkoutSessionId =
                  readString(
                    publication[
                      'stripeCheckoutSessionId'
                    ]
                  );

                if (!checkoutSessionId) {
                  return null;
                }

                const paymentBreakdown =
                  isRecord(
                    publication[
                      'paymentBreakdown'
                    ]
                  )
                    ? publication[
                      'paymentBreakdown'
                    ]
                    : {};

                return {
                  listingUid:
                    documentSnapshot.id,

                  publishedListingUid:
                    readNullableString(
                      publication[
                        'publishedListingUid'
                      ]
                    ),

                  sellerUid:
                    readString(
                      data['sellerUid']
                    ),

                  propertyAddress:
                    readPropertyAddress(data),

                  featuredListing:
                    data[
                      'featuredListing'
                    ] === true,

                  status:
                    readPaymentStatus(
                      publication[
                        'paymentStatus'
                      ],
                      publication[
                        'stripePaymentStatus'
                      ],
                      paymentBreakdown[
                        'totalAmount'
                      ]
                    ),

                  stripePaymentStatus:
                    readNullableString(
                      publication[
                        'stripePaymentStatus'
                      ]
                    ),

                  stripeCheckoutSessionId:
                    checkoutSessionId,

                  stripePaymentIntentId:
                    readNullableString(
                      publication[
                        'stripePaymentIntentId'
                      ]
                    ),

                  breakdown: {
                    listingFee:
                      readNumber(
                        paymentBreakdown[
                          'listingFee'
                        ]
                      ) ?? 0,

                    featuredListingFee:
                      readNumber(
                        paymentBreakdown[
                          'featuredListingFee'
                        ]
                      ) ?? 0,

                    subtotalAmount:
                      readNumber(
                        paymentBreakdown[
                          'subtotalAmount'
                        ]
                      ) ?? 0,

                    discountAmount:
                      readNumber(
                        paymentBreakdown[
                          'discountAmount'
                        ]
                      ) ?? 0,

                    totalAmount:
                      readNumber(
                        paymentBreakdown[
                          'totalAmount'
                        ] ??
                        publication[
                          'paymentAmount'
                        ]
                      ) ?? 0,

                    promotionCode:
                      readNullableString(
                        paymentBreakdown[
                          'promotionCode'
                        ]
                      ),

                    promotionCodeUid:
                      readNullableString(
                        paymentBreakdown[
                          'promotionCodeUid'
                        ]
                      ),

                    stripePromotionCodeId:
                      readNullableString(
                        paymentBreakdown[
                          'stripePromotionCodeId'
                        ]
                      )
                  },

                  checkoutCreatedAt:
                    serializeDate(
                      publication[
                        'checkoutCreatedAt'
                      ]
                    ),

                  paidAt:
                    serializeDate(
                      publication['paidAt']
                    ),

                  publishedAt:
                    serializeDate(
                      publication[
                        'publishedAt'
                      ]
                    ),

                  updatedAt:
                    serializeDate(
                      data['updatedAt']
                    )
                } satisfies AdministrationPayment;
              }
            )
            .filter(
              (
                payment
              ): payment is AdministrationPayment =>
                payment !== null
            );

        return {
          payments,

          summary: {
            totalTransactions:
              payments.length,

            paidTransactions:
              payments.filter(
                payment =>
                  payment.status ===
                  'paid'
              ).length,

            pendingTransactions:
              payments.filter(
                payment =>
                  payment.status ===
                  'pending'
              ).length,

            failedTransactions:
              payments.filter(
                payment =>
                  payment.status ===
                  'failed'
              ).length,

            noPaymentRequiredTransactions:
              payments.filter(
                payment =>
                  payment.status ===
                  'no_payment_required'
              ).length,

            grossAmount:
              roundCurrency(
                payments.reduce(
                  (
                    total,
                    payment
                  ) =>
                    total +
                    payment.breakdown
                      .subtotalAmount,
                  0
                )
              ),

            discountAmount:
              roundCurrency(
                payments.reduce(
                  (
                    total,
                    payment
                  ) =>
                    total +
                    payment.breakdown
                      .discountAmount,
                  0
                )
              ),

            collectedAmount:
              roundCurrency(
                payments.reduce(
                  (
                    total,
                    payment
                  ) =>
                    total +
                    (
                      payment.status ===
                        'paid' ||
                      payment.status ===
                        'no_payment_required'
                        ? payment.breakdown
                            .totalAmount
                        : 0
                    ),
                  0
                )
              )
          }
        };

      } catch (error: unknown) {
        if (
          error instanceof HttpsError
        ) {
          throw error;
        }

        console.error(
          'Unable to load administration payments:',
          error
        );

        throw new HttpsError(
          'internal',
          'NavStreet payment records could not be loaded.'
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

function readPaymentStatus(
  paymentStatus: unknown,
  stripePaymentStatus: unknown,
  totalAmount: unknown
): AdministrationPaymentStatus {
  const normalizedStripeStatus =
    readString(
      stripePaymentStatus
    );

  if (
    normalizedStripeStatus ===
    'no_payment_required'
  ) {
    return 'no_payment_required';
  }

  const normalizedPaymentStatus =
    readString(
      paymentStatus
    );

  if (
    normalizedPaymentStatus ===
    'paid'
  ) {
    return (
      readNumber(totalAmount) === 0
        ? 'no_payment_required'
        : 'paid'
    );
  }

  if (
    normalizedPaymentStatus ===
      'pending' ||
    normalizedPaymentStatus ===
      'payment_processing'
  ) {
    return 'pending';
  }

  if (
    normalizedPaymentStatus ===
      'failed' ||
    normalizedPaymentStatus ===
      'payment_failed'
  ) {
    return 'failed';
  }

  return 'unknown';
}

function readPropertyAddress(
  data: Record<string, unknown>
): string {
  const address =
    isRecord(
      data['address']
    )
      ? data['address']
      : {};

  const cityStatePostal = [
    readString(
      address['city'] ??
      data['city']
    ),

    readString(
      address['state'] ??
      data['state']
    )
  ]
    .filter(Boolean)
    .join(', ');

  return [
    readString(
      address['addressLine1'] ??
      data['addressLine1']
    ),

    [
      cityStatePostal,

      readString(
        address['zipCode'] ??
        address['postalCode'] ??
        data['zipCode']
      )
    ]
      .filter(Boolean)
      .join(' ')
  ]
    .filter(Boolean)
    .join(', ') ||
    'Address unavailable';
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

function readNumber(
  value: unknown
): number | null {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
    ? value
    : null;
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

function roundCurrency(
  value: number
): number {
  return Math.round(
    value * 100
  ) / 100;
}