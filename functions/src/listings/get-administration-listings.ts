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

type AdministrationListingStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'active'
  | 'paused'
  | 'under_contract'
  | 'sold'
  | 'withdrawn'
  | 'archived';

interface AdministrationListingAddress {
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
}

interface AdministrationListing {
  uid: string;
  sellerUid: string;

  title: string;
  propertyType: string;
  status: AdministrationListingStatus;

  price: number;
  featuredListing: boolean;

  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;

  address: AdministrationListingAddress;

  viewCount: number;
  favoriteCount: number;
  inquiryCount: number;
  photoCount: number;

  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface AdministrationListingSummary {
  totalListings: number;
  activeListings: number;
  featuredListings: number;
  underContractListings: number;
  soldListings: number;
  inactiveListings: number;
}

interface GetAdministrationListingsResult {
  listings: AdministrationListing[];
  summary: AdministrationListingSummary;
}

const LISTING_COLLECTION =
  'listings';

const MAXIMUM_LISTING_RESULTS =
  500;

export const getAdministrationListings =
  onCall<
    void,
    Promise<GetAdministrationListingsResult>
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
              LISTING_COLLECTION
            )
            .orderBy(
              'createdAt',
              'desc'
            )
            .limit(
              MAXIMUM_LISTING_RESULTS
            )
            .get();

        const listings =
          snapshot.docs.map(
            documentSnapshot => {
              const data =
                documentSnapshot.data();

              const status =
                readListingStatus(
                  data['status']
                );

              return {
                uid:
                  documentSnapshot.id,

                sellerUid:
                  readString(
                    data['sellerUid']
                  ),

                title:
                  readListingTitle(data),

                propertyType:
                  readString(
                    data['propertyType']
                  ) || 'Unknown',

                status,

                price:
                  readNumber(
                    data['price'] ??
                    data['listPrice']
                  ) ?? 0,

                featuredListing:
                  data['featuredListing'] ===
                  true,

                bedrooms:
                  readNumber(
                    data['bedrooms']
                  ),

                bathrooms:
                  readBathrooms(data),

                squareFeet:
                  readNumber(
                    data['squareFeet']
                  ),

                address:
                  readAddress(data),

                viewCount:
                  readNumber(
                    data['viewCount'] ??
                    data['views']
                  ) ?? 0,

                favoriteCount:
                  readNumber(
                    data['favoriteCount'] ??
                    data['favorites']
                  ) ?? 0,

                inquiryCount:
                  readNumber(
                    data['inquiryCount']
                  ) ?? 0,

                photoCount:
                  readPhotoCount(data),

                publishedAt:
                  serializeDate(
                    data['publishedAt']
                  ),

                createdAt:
                  serializeDate(
                    data['createdAt']
                  ),

                updatedAt:
                  serializeDate(
                    data['updatedAt']
                  )
              } satisfies AdministrationListing;
            }
          );

        return {
          listings,

          summary: {
            totalListings:
              listings.length,

            activeListings:
              listings.filter(
                listing =>
                  listing.status ===
                    'active' ||
                  listing.status ===
                    'published'
              ).length,

            featuredListings:
              listings.filter(
                listing =>
                  listing.featuredListing
              ).length,

            underContractListings:
              listings.filter(
                listing =>
                  listing.status ===
                  'under_contract'
              ).length,

            soldListings:
              listings.filter(
                listing =>
                  listing.status ===
                  'sold'
              ).length,

            inactiveListings:
              listings.filter(
                listing =>
                  [
                    'paused',
                    'withdrawn',
                    'archived'
                  ].includes(
                    listing.status
                  )
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
          'Unable to load administration listings:',
          error
        );

        throw new HttpsError(
          'internal',
          'NavStreet listings could not be loaded.'
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

function readListingStatus(
  value: unknown
): AdministrationListingStatus {
  switch (value) {
    case 'draft':
    case 'pending_review':
    case 'published':
    case 'active':
    case 'paused':
    case 'under_contract':
    case 'sold':
    case 'withdrawn':
    case 'archived':
      return value;

    default:
      return 'published';
  }
}

function readListingTitle(
  data: Record<string, unknown>
): string {
  const title =
    readString(
      data['title']
    );

  if (title) {
    return title;
  }

  const address =
    readAddress(data);

  return [
    address.addressLine1,
    address.city,
    address.state
  ]
    .filter(Boolean)
    .join(', ') ||
    'Untitled listing';
}

function readAddress(
  data: Record<string, unknown>
): AdministrationListingAddress {
  const nestedAddress =
    isRecord(
      data['address']
    )
      ? data['address']
      : {};

  return {
    addressLine1:
      readString(
        nestedAddress['addressLine1'] ??
        data['addressLine1']
      ),

    city:
      readString(
        nestedAddress['city'] ??
        data['city']
      ),

    state:
      readString(
        nestedAddress[
          'stateAbbreviation'
        ] ??
        nestedAddress['state'] ??
        data['state']
      ),

    postalCode:
      readString(
        nestedAddress['postalCode'] ??
        data['zipCode']
      )
  };
}

function readBathrooms(
  data: Record<string, unknown>
): number | null {
  const bathrooms =
    readNumber(
      data['bathrooms']
    );

  if (bathrooms !== null) {
    return bathrooms;
  }

  const fullBathrooms =
    readNumber(
      data['fullBathrooms']
    ) ?? 0;

  const halfBathrooms =
    readNumber(
      data['halfBathrooms']
    ) ?? 0;

  if (
    fullBathrooms === 0 &&
    halfBathrooms === 0
  ) {
    return null;
  }

  return (
    fullBathrooms +
    halfBathrooms * 0.5
  );
}

function readPhotoCount(
  data: Record<string, unknown>
): number {
  const storedPhotoCount =
    readNumber(
      data['photoCount']
    );

  if (storedPhotoCount !== null) {
    return storedPhotoCount;
  }

  if (
    Array.isArray(
      data['photos']
    )
  ) {
    return data['photos'].length;
  }

  if (
    Array.isArray(
      data['photoUrls']
    )
  ) {
    return data['photoUrls'].length;
  }

  return 0;
}

function readString(
  value: unknown
): string {
  return typeof value === 'string'
    ? value.trim()
    : '';
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

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
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