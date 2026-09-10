import Stripe from 'stripe';

import {
  FieldValue,
} from 'firebase-admin/firestore';

import type {
  DocumentReference,
} from 'firebase-admin/firestore';

import {
  HttpsError,
  onCall,
} from 'firebase-functions/v2/https';

import {
  defineSecret,
} from 'firebase-functions/params';

import {
  adminFirestore,
} from '../shared/firebase-admin';

import {
  callableFunctionOptions,
} from '../shared/function-options';


const stripeSecretKey =
  defineSecret('STRIPE_SECRET_KEY');


type OfferIdentityStatus =
  | 'requires_input'
  | 'processing'
  | 'verified';


interface CreateOfferIdentityVerificationSessionRequest {
  listingUid: string;
  returnBaseUrl: string;
  returnPath: string;
}


interface CreateOfferIdentityVerificationSessionResult {
  verificationSessionId: string | null;
  verificationUrl: string | null;
  status: OfferIdentityStatus;
  alreadyVerified: boolean;
}


interface UserIdentityDocument {
  identityStatus?: string;
  identityVerificationStatus?: string;

  stripeIdentityVerificationSessionId?: string;
  identityVerificationSessionId?: string;

  verifiedFirstName?: string;
  verifiedLastName?: string;
}


interface ListingDocument {
  sellerUid?: string;
  status?: string;
  acceptingOffers?: boolean;
}


export const createOfferIdentityVerificationSession =
  onCall<
    CreateOfferIdentityVerificationSessionRequest,
    Promise<CreateOfferIdentityVerificationSessionResult>
  >(
    {
      ...callableFunctionOptions,
      secrets: [
        stripeSecretKey,
      ],
    },
    async request => {
      const userUid =
        request.auth?.uid;

      if (!userUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must be signed in before making an offer.'
        );
      }

      const userEmail =
        request.auth?.token.email;

      const listingUid =
        requireIdentifier(
          request.data?.listingUid,
          'listingUid'
        );

      const returnBaseUrl =
        requireAllowedBaseUrl(
          request.data?.returnBaseUrl
        );

      const returnPath =
        requireOfferReturnPath(
          request.data?.returnPath,
          listingUid
        );

      const firestore =
        adminFirestore;

      const userReference =
        firestore
          .collection('users')
          .doc(userUid);

      const listingReference =
        firestore
          .collection('listings')
          .doc(listingUid);

      const [
        userSnapshot,
        listingSnapshot,
      ] = await Promise.all([
        userReference.get(),
        listingReference.get(),
      ]);

      if (!userSnapshot.exists) {
        throw new HttpsError(
          'failed-precondition',
          'Complete your NavStreet account before making an offer.'
        );
      }

      if (!listingSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'The property listing could not be found.'
        );
      }

      const user =
        userSnapshot.data() as
          UserIdentityDocument;

      const listing =
        listingSnapshot.data() as
          ListingDocument;

      if (isIdentityVerified(user)) {
        return {
          verificationSessionId:
            getStoredSessionId(user),
          verificationUrl: null,
          status: 'verified',
          alreadyVerified: true,
        };
      }

      if (listing.sellerUid === userUid) {
        throw new HttpsError(
          'failed-precondition',
          'You cannot make an offer on your own property.'
        );
      }

      if (
        listing.status?.toLowerCase() !== 'active' ||
        listing.acceptingOffers === false
      ) {
        throw new HttpsError(
          'failed-precondition',
          'This property is not currently accepting offers.'
        );
      }

      const verificationReturnUrl =
        `${returnBaseUrl}` +
        `/listings/${encodeURIComponent(listingUid)}` +
        `/offer/verification-return` +
        `?returnUrl=${encodeURIComponent(returnPath)}`;

      const stripe =
        new Stripe(
          stripeSecretKey.value()
        );

      const existingSessionId =
        getStoredSessionId(user);

      if (existingSessionId) {
        try {
          const existingSession =
            await stripe.identity
              .verificationSessions
              .retrieve(
                existingSessionId,
                {
                  expand: [
                    'verified_outputs',
                  ],
                }
              );

          if (
            existingSession.status ===
            'verified'
          ) {
            await markAccountVerified(
              userReference,
              existingSession
            );

            return {
              verificationSessionId:
                existingSession.id,
              verificationUrl: null,
              status: 'verified',
              alreadyVerified: true,
            };
          }

          if (
            existingSession.status ===
            'processing'
          ) {
            return {
              verificationSessionId:
                existingSession.id,
              verificationUrl: null,
              status: 'processing',
              alreadyVerified: false,
            };
          }

          if (
            existingSession.status ===
            'requires_input'
          ) {
            if (
              existingSession.metadata
                ?.purpose ===
                  'offer_identity' &&
              existingSession.metadata
                ?.userUid === userUid &&
              existingSession.metadata
                ?.listingUid === listingUid
            ) {
              return {
                verificationSessionId:
                  existingSession.id,
                verificationUrl:
                  existingSession.url,
                status: 'requires_input',
                alreadyVerified: false,
              };
            }

            await stripe.identity
              .verificationSessions
              .cancel(
                existingSession.id
              );
          }
        } catch (error) {
          console.error(
            'Unable to reuse the existing Stripe Identity session for an offer.',
            {
              listingUid,
              userUid,
              existingSessionId,
              error,
            }
          );
        }
      }

      try {
        const verificationSession =
          await stripe.identity
            .verificationSessions
            .create(
              {
                type: 'document',
                client_reference_id:
                  userUid,
                return_url:
                  verificationReturnUrl,
                provided_details:
                  userEmail
                    ? {
                      email:
                        String(
                          userEmail
                        ),
                    }
                    : undefined,
                options: {
                  document: {
                    allowed_types: [
                      'driving_license',
                      'id_card',
                      'passport',
                    ],
                    require_matching_selfie:
                      true,
                  },
                },
                metadata: {
                  purpose:
                    'offer_identity',
                  userUid,
                  listingUid,
                },
              },
              {
                idempotencyKey:
                  `navstreet-offer-identity-${userUid}-${existingSessionId ?? 'new'}`,
              }
            );

        await userReference.set(
          {
            identityStatus:
              verificationSession.status,
            stripeIdentityVerificationSessionId:
              verificationSession.id,
            identityVerification: {
              status:
                verificationSession.status,
              purpose:
                'offer_identity',
              listingUid,
              stripeVerificationSessionId:
                verificationSession.id,
              createdAt:
                FieldValue.serverTimestamp(),
              updatedAt:
                FieldValue.serverTimestamp(),
            },
            updatedAt:
              FieldValue.serverTimestamp(),
          },
          {
            merge: true,
          }
        );

        return {
          verificationSessionId:
            verificationSession.id,
          verificationUrl:
            verificationSession.url,
          status: 'requires_input',
          alreadyVerified: false,
        };
      } catch (error) {
        console.error(
          'Stripe Identity session creation failed for an offer.',
          {
            listingUid,
            userUid,
            error,
          }
        );

        throw new HttpsError(
          'internal',
          'Identity verification could not be started. Please try again.'
        );
      }
    }
  );


function requireIdentifier(
  value: unknown,
  fieldName: string
): string {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(value)
  ) {
    throw new HttpsError(
      'invalid-argument',
      `${fieldName} is invalid.`
    );
  }

  return value;
}


function requireAllowedBaseUrl(
  value: unknown
): string {
  if (typeof value !== 'string') {
    throw new HttpsError(
      'invalid-argument',
      'A valid return URL is required.'
    );
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new HttpsError(
      'invalid-argument',
      'A valid return URL is required.'
    );
  }

  const isLocalDevelopment =
    url.protocol === 'http:' &&
    (
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1'
    );

  if (
    url.protocol !== 'https:' &&
    !isLocalDevelopment
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The return URL must use HTTPS.'
    );
  }

  return url.origin;
}


function requireOfferReturnPath(
  value: unknown,
  listingUid: string
): string {
  const expectedPath =
    `/listings/${listingUid}/offer`;

  if (
    typeof value !== 'string' ||
    (
      value !== expectedPath &&
      !value.startsWith(
        `${expectedPath}?`
      )
    )
  ) {
    throw new HttpsError(
      'invalid-argument',
      'The offer return path is invalid.'
    );
  }

  return value;
}


function isIdentityVerified(
  user: UserIdentityDocument
): boolean {
  return (
    user.identityStatus === 'verified' ||
    user.identityVerificationStatus ===
      'verified' ||
    (
      Boolean(
        user.verifiedFirstName?.trim()
      ) &&
      Boolean(
        user.verifiedLastName?.trim()
      )
    )
  );
}


function getStoredSessionId(
  user: UserIdentityDocument
): string | null {
  return (
    user.stripeIdentityVerificationSessionId ??
    user.identityVerificationSessionId ??
    null
  );
}


async function markAccountVerified(
  userReference:
    DocumentReference,
  session:
    Stripe.Identity.VerificationSession
): Promise<void> {
  const verifiedOutputs =
    getVerifiedOutputs(session);

  await userReference.set(
    {
      identityStatus: 'verified',
      stripeIdentityVerificationSessionId:
        session.id,
      identityVerifiedAt:
        FieldValue.serverTimestamp(),
      verifiedFirstName:
        verifiedOutputs.firstName,
      verifiedMiddleName:
        verifiedOutputs.middleName,
      verifiedLastName:
        verifiedOutputs.lastName,
      'identityVerification.status':
        'verified',
      'identityVerification.stripeVerificationSessionId':
        session.id,
      'identityVerification.updatedAt':
        FieldValue.serverTimestamp(),
      updatedAt:
        FieldValue.serverTimestamp(),
    },
    {
      merge: true,
    }
  );
}


function getVerifiedOutputs(
  session:
    Stripe.Identity.VerificationSession
): {
  firstName: string;
  middleName: string | null;
  lastName: string;
} {
  const verifiedSession =
    session as
      Stripe.Identity.VerificationSession & {
        verified_outputs?: {
          first_name?: string | null;
          last_name?: string | null;
        } | null;
      };

  const firstName =
    verifiedSession.verified_outputs
      ?.first_name
      ?.trim();

  const lastName =
    verifiedSession.verified_outputs
      ?.last_name
      ?.trim();

  if (!firstName || !lastName) {
    throw new HttpsError(
      'failed-precondition',
      'Stripe verified your identity, but the verified legal name is not yet available. Please try again shortly.'
    );
  }

  return {
    firstName,
    middleName: null,
    lastName,
  };
}
