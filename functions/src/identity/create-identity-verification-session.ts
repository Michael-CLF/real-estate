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
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  defineSecret
} from 'firebase-functions/params';

import {
  callableFunctionOptions
} from '../shared/function-options';


if (getApps().length === 0) {
  initializeApp();
}


const stripeSecretKey =
  defineSecret('STRIPE_SECRET_KEY');

const DEVELOPMENT_SITE_URL =
  'http://localhost:4200';


interface CreateIdentityVerificationSessionRequest {
  listingUid: string;
}


interface CreateIdentityVerificationSessionResult {
  verificationSessionId: string;
  verificationUrl: string | null;
  status:
  | 'requires_input'
  | 'processing'
  | 'verified';
  alreadyVerified: boolean;
}


interface ListingDraftDocument {
  sellerUid?: string;

  certification?: {
    accepted?: boolean;
  };

  progress?: {
    contentStatus?: string;
  };

  identityVerification?: {
    stripeVerificationSessionId?: string;
    status?: string;
  };
}


export const createIdentityVerificationSession =
  onCall<
    CreateIdentityVerificationSessionRequest,
    Promise<CreateIdentityVerificationSessionResult>
  >(
    {
      ...callableFunctionOptions,
      secrets: [stripeSecretKey]
    },

    async request => {
      const sellerUid =
        request.auth?.uid;

      if (!sellerUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must be signed in to verify your identity.'
        );
      }


      const listingUid =
        request.data.listingUid?.trim();

      if (!listingUid) {
        throw new HttpsError(
          'invalid-argument',
          'A listing draft is required.'
        );
      }


      const verificationReturnUrl =
        `${DEVELOPMENT_SITE_URL}` +
        `/sell/listings/${listingUid}` +
        `/verification-return`;


      const firestore =
        getFirestore();

      const draftReference =
        firestore
          .collection('listingDrafts')
          .doc(listingUid);

      const draftSnapshot =
        await draftReference.get();

      if (!draftSnapshot.exists) {
        throw new HttpsError(
          'not-found',
          'The listing draft could not be found.'
        );
      }


      const draft =
        draftSnapshot.data() as
        | ListingDraftDocument
        | undefined;

      if (!draft) {
        throw new HttpsError(
          'not-found',
          'The listing draft could not be read.'
        );
      }


      if (draft.sellerUid !== sellerUid) {
        throw new HttpsError(
          'permission-denied',
          'You do not have permission to verify identity for this listing.'
        );
      }


      if (
        draft.progress?.contentStatus !==
        'complete'
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Complete the listing before beginning identity verification.'
        );
      }


      if (
        draft.certification?.accepted !==
        true
      ) {
        throw new HttpsError(
          'failed-precondition',
          'Accept the seller certification before beginning identity verification.'
        );
      }


      const stripe =
        new Stripe(
          stripeSecretKey.value()
        );

      const existingSessionId =
        draft.identityVerification
          ?.stripeVerificationSessionId;


      if (existingSessionId) {
        try {
          const existingSession =
            await stripe.identity
              .verificationSessions
              .retrieve(
                existingSessionId
              );


          if (
            existingSession.status ===
            'verified'
          ) {
            await draftReference.update({
              'publication.identityStatus':
                'verified',

              'publication.status':
                'payment_required',

              'identityVerification.status':
                'verified',

              'identityVerification.updatedAt':
                FieldValue.serverTimestamp(),

              updatedAt:
                FieldValue.serverTimestamp(),

              lastSavedAt:
                FieldValue.serverTimestamp()
            });

            return {
              verificationSessionId:
                existingSession.id,

              verificationUrl:
                null,

              status:
                'verified',

              alreadyVerified:
                true
            };
          }


          if (
            existingSession.status ===
            'requires_input'
          ) {
            if (
              (
                existingSession as Stripe.Identity.VerificationSession & {
                  return_url?: string | null;
                }
              ).return_url ===
              verificationReturnUrl
            ) {
              return {
                verificationSessionId:
                  existingSession.id,

                verificationUrl:
                  existingSession.url,

                status:
                  'requires_input',

                alreadyVerified:
                  false
              };
            }

            await stripe.identity
              .verificationSessions
              .cancel(
                existingSession.id
              );
          }


          if (
            existingSession.status ===
            'processing'
          ) {
            return {
              verificationSessionId:
                existingSession.id,

              verificationUrl:
                existingSession.url,

              status:
                'processing',

              alreadyVerified:
                false
            };
          }
        } catch (error) {
          console.error(
            'Unable to retrieve or cancel the existing Stripe Identity session.',
            {
              listingUid,
              sellerUid,
              existingSessionId,
              error
            }
          );
        }
      }


      const sellerEmail =
        request.auth?.token?.email;


      try {
        const verificationSession =
          await stripe.identity
            .verificationSessions
            .create({
              type:
                'document',

              client_reference_id:
                listingUid,

              return_url:
                verificationReturnUrl,

              provided_details:
                sellerEmail
                  ? {
                    email:
                      String(sellerEmail)
                  }
                  : undefined,

              options: {
                document: {
                  allowed_types: [
                    'driving_license',
                    'id_card',
                    'passport'
                  ],

                  require_matching_selfie:
                    true
                }
              },

              metadata: {
                listingUid,
                sellerUid
              }
            });


        await draftReference.update({
          'publication.identityStatus':
            'pending',

          'publication.status':
            'identity_required',

          identityVerification: {
            stripeVerificationSessionId:
              verificationSession.id,

            status:
              verificationSession.status,

            createdAt:
              FieldValue.serverTimestamp(),

            updatedAt:
              FieldValue.serverTimestamp()
          },

          updatedAt:
            FieldValue.serverTimestamp(),

          lastSavedAt:
            FieldValue.serverTimestamp()
        });


        return {
          verificationSessionId:
            verificationSession.id,

          verificationUrl:
            verificationSession.url,

          status:
            'requires_input',

          alreadyVerified:
            false
        };
      } catch (error) {
        console.error(
          'Stripe Identity session creation failed.',
          {
            listingUid,
            sellerUid,
            error
          }
        );

        throw new HttpsError(
          'internal',
          'Identity verification could not be started. Please try again.'
        );
      }
    }
  );