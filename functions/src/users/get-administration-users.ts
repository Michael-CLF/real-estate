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

interface AdministrationUser {
  uid: string;
  accountNumber: string | null;

  firstName: string;
  lastName: string;
  displayName: string;

  email: string;
  phone: string | null;
  photoURL: string | null;

  emailVerified: boolean;
  status: 'active' | 'disabled';

  createdAt: string | null;
  updatedAt: string | null;
  lastLoginAt: string | null;
}

interface GetAdministrationUsersResult {
  users: AdministrationUser[];

  summary: {
    totalUsers: number;
    activeUsers: number;
    disabledUsers: number;
    verifiedUsers: number;
  };
}

const USER_COLLECTION = 'users';

const MAXIMUM_USER_RESULTS = 250;

export const getAdministrationUsers =
  onCall<
    void,
    Promise<GetAdministrationUsersResult>
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
            .collection(USER_COLLECTION)
            .orderBy(
              'createdAt',
              'desc'
            )
            .limit(
              MAXIMUM_USER_RESULTS
            )
            .get();

        const users =
          snapshot.docs.map(
            documentSnapshot => {
              const data =
                documentSnapshot.data();

              return {
                uid:
                  documentSnapshot.id,

                accountNumber:
                  readNullableString(
                    data['accountNumber']
                  ),

                firstName:
                  readString(
                    data['firstName']
                  ),

                lastName:
                  readString(
                    data['lastName']
                  ),

                displayName:
                  readDisplayName(data),

                email:
                  readString(
                    data['email']
                  ),

                phone:
                  readNullableString(
                    data['phone']
                  ),

                photoURL:
                  readNullableString(
                    data['photoURL']
                  ),

                emailVerified:
                  data['emailVerified'] ===
                  true,

                status:
                  data['status'] ===
                  'disabled'
                    ? 'disabled'
                    : 'active',

                createdAt:
                  serializeDate(
                    data['createdAt']
                  ),

                updatedAt:
                  serializeDate(
                    data['updatedAt']
                  ),

                lastLoginAt:
                  serializeDate(
                    data['lastLoginAt']
                  )
              } satisfies AdministrationUser;
            }
          );

        return {
          users,

          summary: {
            totalUsers:
              users.length,

            activeUsers:
              users.filter(
                user =>
                  user.status ===
                  'active'
              ).length,

            disabledUsers:
              users.filter(
                user =>
                  user.status ===
                  'disabled'
              ).length,

            verifiedUsers:
              users.filter(
                user =>
                  user.emailVerified
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
          'Unable to load administration users:',
          error
        );

        throw new HttpsError(
          'internal',
          'NavStreet user accounts could not be loaded.'
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

function readDisplayName(
  data: Record<string, unknown>
): string {
  const displayName =
    readString(
      data['displayName']
    );

  if (displayName) {
    return displayName;
  }

  return [
    readString(
      data['firstName']
    ),
    readString(
      data['lastName']
    )
  ]
    .filter(Boolean)
    .join(' ');
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