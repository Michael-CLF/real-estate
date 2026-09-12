import {
  DocumentData,
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


type AdministrationListingRecordType =
  | 'draft'
  | 'published';


type AdministrationListingStatus =
  | 'draft'
  | 'pending_review'
  | 'published'
  | 'coming_soon'
  | 'active'
  | 'paused'
  | 'under_contract'
  | 'pending'
  | 'sold'
  | 'expired'
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

  recordType:
    AdministrationListingRecordType;

  sourceDraftUid: string | null;

  linkedPublishedListingUid:
    string | null;

  title: string;
  propertyType: string;

  status:
    AdministrationListingStatus;

  publicationStatus: string | null;
  identityStatus: string | null;
  paymentStatus: string | null;

  completionPercent: number | null;

  price: number;
  featuredListing: boolean;

  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;

  address:
    AdministrationListingAddress;

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
  draftListings: number;
  activeListings: number;
  featuredListings: number;
  underContractListings: number;
  soldListings: number;
  inactiveListings: number;
}


interface GetAdministrationListingsResult {
  listings:
    AdministrationListing[];

  summary:
    AdministrationListingSummary;
}


const LISTING_COLLECTION =
  'listings';

const DRAFT_COLLECTION =
  'listingDrafts';

const MAXIMUM_LISTING_RESULTS =
  500;

const MAXIMUM_DRAFT_RESULTS =
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
        const [
          publishedSnapshot,
          draftSnapshot
        ] = await Promise.all([
          adminFirestore
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
            .get(),

          adminFirestore
            .collection(
              DRAFT_COLLECTION
            )
            .orderBy(
              'createdAt',
              'desc'
            )
            .limit(
              MAXIMUM_DRAFT_RESULTS
            )
            .get()
        ]);

        const publishedListingUids =
          new Set(
            publishedSnapshot.docs.map(
              documentSnapshot =>
                documentSnapshot.id
            )
          );

        /*
         * Published source drafts are associated with
         * their published row instead of appearing as
         * duplicate independent table records.
         */
        const sourceDraftUidByListingUid =
          new Map<string, string>();

        draftSnapshot.docs.forEach(
          documentSnapshot => {
            const publishedListingUid =
              readNestedString(
                documentSnapshot.data(),
                'publication',
                'publishedListingUid'
              );

            if (
              publishedListingUid &&
              publishedListingUids.has(
                publishedListingUid
              )
            ) {
              sourceDraftUidByListingUid.set(
                publishedListingUid,
                documentSnapshot.id
              );
            }
          }
        );

        const publishedListings =
          publishedSnapshot.docs.map(
            documentSnapshot =>
              mapPublishedListing(
                documentSnapshot.id,
                documentSnapshot.data(),
                sourceDraftUidByListingUid.get(
                  documentSnapshot.id
                ) ?? null
              )
          );

        const unfinishedDrafts =
          draftSnapshot.docs
            .filter(
              documentSnapshot => {
                const publishedListingUid =
                  readNestedString(
                    documentSnapshot.data(),
                    'publication',
                    'publishedListingUid'
                  );

                /*
                 * Keep a linked draft visible if its
                 * published listing no longer exists.
                 * That exposes orphaned test data for
                 * administrator review and cleanup.
                 */
                return (
                  !publishedListingUid ||
                  !publishedListingUids.has(
                    publishedListingUid
                  )
                );
              }
            )
            .map(
              documentSnapshot =>
                mapDraftListing(
                  documentSnapshot.id,
                  documentSnapshot.data()
                )
            );

        const listings = [
          ...publishedListings,
          ...unfinishedDrafts
        ].sort(
          (
            firstListing,
            secondListing
          ) =>
            getSortableDate(
              secondListing.updatedAt ??
              secondListing.createdAt
            ) -
            getSortableDate(
              firstListing.updatedAt ??
              firstListing.createdAt
            )
        );

        return {
          listings,

          summary:
            createSummary(listings)
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


function mapPublishedListing(
  uid: string,
  data: DocumentData,
  sourceDraftUid: string | null
): AdministrationListing {
  const status =
    readListingStatus(
      data['status']
    );

  const address =
    readPublishedAddress(data);

  return {
    uid,

    sellerUid:
      readString(
        data['sellerUid']
      ),

    recordType:
      'published',

    sourceDraftUid,

    linkedPublishedListingUid:
      uid,

    title:
      readListingTitle(
        data,
        address
      ),

    propertyType:
      readString(
        data['propertyType']
      ) || 'Unknown',

    status,

    publicationStatus:
      'published',

    identityStatus:
      null,

    paymentStatus:
      null,

    completionPercent:
      100,

    price:
      readNumber(
        data['price'] ??
        data['listPrice']
      ) ?? 0,

    featuredListing:
      data['featuredListing'] === true,

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

    address,

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
        data['inquiryCount'] ??
        data['inquiries']
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
  };
}


function mapDraftListing(
  uid: string,
  data: DocumentData
): AdministrationListing {
  const address =
    readDraftAddress(data);

  const propertyDetails =
    readRecord(
      data['propertyDetails']
    );

  const pricing =
    readRecord(
      data['pricing']
    );

  const progress =
    readRecord(
      data['progress']
    );

  const publication =
    readRecord(
      data['publication']
    );

  return {
    uid,

    sellerUid:
      readString(
        data['sellerUid']
      ),

    recordType:
      'draft',

    sourceDraftUid:
      uid,

    linkedPublishedListingUid:
      readString(
        publication[
          'publishedListingUid'
        ]
      ) || null,

    title:
      readListingTitle(
        data,
        address
      ),

    propertyType:
      readString(
        propertyDetails[
          'propertyType'
        ]
      ) || 'Not selected',

    status:
      'draft',

    publicationStatus:
      readString(
        publication['status']
      ) || null,

    identityStatus:
      readString(
        publication[
          'identityStatus'
        ]
      ) || null,

    paymentStatus:
      readString(
        publication[
          'paymentStatus'
        ]
      ) || null,

    completionPercent:
      readNumber(
        progress[
          'completionPercent'
        ]
      ) ?? 0,

    price:
      readNumber(
        pricing['listPrice']
      ) ?? 0,

    featuredListing:
      data['featuredListing'] === true,

    bedrooms:
      readNumber(
        propertyDetails['bedrooms']
      ),

    bathrooms:
      readDraftBathrooms(
        propertyDetails
      ),

    squareFeet:
      readNumber(
        propertyDetails[
          'squareFeet'
        ]
      ),

    address,

    viewCount:
      0,

    favoriteCount:
      0,

    inquiryCount:
      0,

    photoCount:
      readPhotoCount(data),

    publishedAt:
      serializeDate(
        publication['publishedAt']
      ),

    createdAt:
      serializeDate(
        data['createdAt']
      ),

    updatedAt:
      serializeDate(
        data['updatedAt']
      )
  };
}


function createSummary(
  listings:
    AdministrationListing[]
): AdministrationListingSummary {
  const publishedListings =
    listings.filter(
      listing =>
        listing.recordType ===
        'published'
    );

  return {
    totalListings:
      listings.length,

    draftListings:
      listings.filter(
        listing =>
          listing.recordType ===
          'draft'
      ).length,

    activeListings:
      publishedListings.filter(
        listing =>
          listing.status ===
            'active' ||
          listing.status ===
            'published'
      ).length,

    featuredListings:
      publishedListings.filter(
        listing =>
          listing.featuredListing
      ).length,

    underContractListings:
      publishedListings.filter(
        listing =>
          listing.status ===
          'under_contract'
      ).length,

    soldListings:
      publishedListings.filter(
        listing =>
          listing.status ===
          'sold'
      ).length,

    inactiveListings:
      publishedListings.filter(
        listing =>
          [
            'paused',
            'withdrawn',
            'archived',
            'expired'
          ].includes(
            listing.status
          )
      ).length
  };
}


function readListingStatus(
  value: unknown
): AdministrationListingStatus {
  switch (value) {
    case 'draft':
    case 'pending_review':
    case 'published':
    case 'coming_soon':
    case 'active':
    case 'paused':
    case 'under_contract':
    case 'pending':
    case 'sold':
    case 'expired':
    case 'withdrawn':
    case 'archived':
      return value;

    default:
      return 'published';
  }
}


function readListingTitle(
  data: DocumentData,
  address:
    AdministrationListingAddress
): string {
  const title =
    readString(
      data['title']
    );

  if (title) {
    return title;
  }

  return [
    address.addressLine1,
    address.city,
    address.state
  ]
    .filter(Boolean)
    .join(', ') ||
    'Untitled listing';
}


function readPublishedAddress(
  data: DocumentData
): AdministrationListingAddress {
  const nestedAddress =
    readRecord(
      data['address']
    );

  return {
    addressLine1:
      readString(
        nestedAddress[
          'addressLine1'
        ] ??
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
        nestedAddress[
          'postalCode'
        ] ??
        nestedAddress['zipCode'] ??
        data['zipCode']
      )
  };
}


function readDraftAddress(
  data: DocumentData
): AdministrationListingAddress {
  const address =
    readRecord(
      data['address']
    );

  return {
    addressLine1:
      readString(
        address['addressLine1']
      ),

    city:
      readString(
        address['city']
      ),

    state:
      readString(
        address['state']
      ),

    postalCode:
      readString(
        address['zipCode'] ??
        address['postalCode']
      )
  };
}


function readBathrooms(
  data: DocumentData
): number | null {
  const bathrooms =
    readNumber(
      data['bathrooms']
    );

  if (bathrooms !== null) {
    return bathrooms;
  }

  return combineBathrooms(
    readNumber(
      data['fullBathrooms']
    ),
    readNumber(
      data['halfBathrooms']
    )
  );
}


function readDraftBathrooms(
  propertyDetails:
    Record<string, unknown>
): number | null {
  return combineBathrooms(
    readNumber(
      propertyDetails[
        'fullBathrooms'
      ]
    ),
    readNumber(
      propertyDetails[
        'halfBathrooms'
      ]
    )
  );
}


function combineBathrooms(
  fullBathrooms: number | null,
  halfBathrooms: number | null
): number | null {
  const full =
    fullBathrooms ?? 0;

  const half =
    halfBathrooms ?? 0;

  if (
    full === 0 &&
    half === 0
  ) {
    return null;
  }

  return full + half * 0.5;
}


function readPhotoCount(
  data: DocumentData
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


function readNestedString(
  data: DocumentData,
  objectField: string,
  valueField: string
): string {
  const nestedObject =
    readRecord(
      data[objectField]
    );

  return readString(
    nestedObject[valueField]
  );
}


function readRecord(
  value: unknown
): Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
    ? value as
      Record<string, unknown>
    : {};
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


function getSortableDate(
  value: string | null
): number {
  if (!value) {
    return 0;
  }

  const parsedDate =
    new Date(value);

  return Number.isNaN(
    parsedDate.getTime()
  )
    ? 0
    : parsedDate.getTime();
}


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