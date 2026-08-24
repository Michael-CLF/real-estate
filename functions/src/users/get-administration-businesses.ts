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

type BusinessStatus =
  | 'active'
  | 'suspended'
  | 'removed';

type BusinessSubscriptionStatus =
  | 'free'
  | 'profile';

type BusinessPlacement =
  | 'standard'
  | 'sponsored';

type BusinessServiceAreaType =
  | 'statewide'
  | 'counties'
  | 'cities';

interface AdministrationBusiness {
  uid: string;
  ownerUid: string;

  businessName: string;
  category: string;
  professionalType: string;
  specialties: string[];

  stateName: string;
  stateAbbreviation: string;
  stateSlug: string;

  serviceAreaType:
    BusinessServiceAreaType;

  counties: string[];
  cities: string[];

  phone: string;
  email: string;

  subscriptionStatus:
    BusinessSubscriptionStatus;

  placement:
    BusinessPlacement;

  profileSlug: string | null;
  website: string | null;
  logoUrl: string | null;

  submissionCertified: boolean;

  status: BusinessStatus;

  createdAt: string | null;
  updatedAt: string | null;
}

interface AdministrationBusinessSummary {
  totalBusinesses: number;
  activeBusinesses: number;
  suspendedBusinesses: number;
  removedBusinesses: number;
  profileSubscribers: number;
  sponsoredBusinesses: number;
}

interface GetAdministrationBusinessesResult {
  businesses: AdministrationBusiness[];

  summary:
    AdministrationBusinessSummary;
}

const PROFESSIONAL_COLLECTION =
  'professionalProfiles';

const MAXIMUM_BUSINESS_RESULTS =
  500;

export const getAdministrationBusinesses =
  onCall<
    void,
    Promise<GetAdministrationBusinessesResult>
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
              'createdAt',
              'desc'
            )
            .limit(
              MAXIMUM_BUSINESS_RESULTS
            )
            .get();

        const businesses =
          snapshot.docs.map(
            documentSnapshot => {
              const data =
                documentSnapshot.data();

              return {
                uid:
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

                category:
                  readString(
                    data['category']
                  ),

                professionalType:
                  readString(
                    data['professionalType']
                  ),

                specialties:
                  readStringArray(
                    data['specialties']
                  ),

                stateName:
                  readString(
                    data['stateName']
                  ),

                stateAbbreviation:
                  readString(
                    data['stateAbbreviation']
                  ),

                stateSlug:
                  readString(
                    data['stateSlug']
                  ),

                serviceAreaType:
                  readServiceAreaType(
                    data['serviceAreaType']
                  ),

                counties:
                  readStringArray(
                    data['counties']
                  ),

                cities:
                  readStringArray(
                    data['cities']
                  ),

                phone:
                  readString(
                    data['phone']
                  ),

                email:
                  readString(
                    data['email']
                  ),

                subscriptionStatus:
                  data[
                    'subscriptionStatus'
                  ] === 'profile'
                    ? 'profile'
                    : 'free',

                placement:
                  data['placement'] ===
                  'sponsored'
                    ? 'sponsored'
                    : 'standard',

                profileSlug:
                  readNullableString(
                    data['profileSlug']
                  ),

                website:
                  readNullableString(
                    data['website']
                  ),

                logoUrl:
                  readNullableString(
                    data['logoUrl']
                  ),

                submissionCertified:
                  data[
                    'submissionCertified'
                  ] === true,

                status:
                  readBusinessStatus(
                    data['status']
                  ),

                createdAt:
                  serializeDate(
                    data['createdAt']
                  ),

                updatedAt:
                  serializeDate(
                    data['updatedAt']
                  )
              } satisfies AdministrationBusiness;
            }
          );

        return {
          businesses,

          summary: {
            totalBusinesses:
              businesses.length,

            activeBusinesses:
              businesses.filter(
                business =>
                  business.status ===
                  'active'
              ).length,

            suspendedBusinesses:
              businesses.filter(
                business =>
                  business.status ===
                  'suspended'
              ).length,

            removedBusinesses:
              businesses.filter(
                business =>
                  business.status ===
                  'removed'
              ).length,

            profileSubscribers:
              businesses.filter(
                business =>
                  business
                    .subscriptionStatus ===
                  'profile'
              ).length,

            sponsoredBusinesses:
              businesses.filter(
                business =>
                  business.placement ===
                  'sponsored'
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
          'Unable to load administration businesses:',
          error
        );

        throw new HttpsError(
          'internal',
          'NavStreet business profiles could not be loaded.'
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

function readBusinessStatus(
  value: unknown
): BusinessStatus {
  switch (value) {
    case 'suspended':
    case 'removed':
      return value;

    default:
      return 'active';
  }
}

function readServiceAreaType(
  value: unknown
): BusinessServiceAreaType {
  switch (value) {
    case 'counties':
    case 'cities':
      return value;

    default:
      return 'statewide';
  }
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

function readStringArray(
  value: unknown
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string' &&
        item.trim().length > 0
    )
    .map(
      item => item.trim()
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