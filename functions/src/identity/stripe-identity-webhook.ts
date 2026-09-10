import Stripe from 'stripe';

import {
  FieldValue,
  getFirestore,
} from 'firebase-admin/firestore';

import {
  getApps,
  initializeApp,
} from 'firebase-admin/app';

import {
  onRequest,
} from 'firebase-functions/v2/https';

import {
  defineSecret,
} from 'firebase-functions/params';

import {
  FUNCTION_REGION,
} from '../shared/function-options';


if (getApps().length === 0) {
  initializeApp();
}


const stripeSecretKey =
  defineSecret('STRIPE_SECRET_KEY');

const stripeIdentityWebhookSecret =
  defineSecret(
    'STRIPE_IDENTITY_WEBHOOK_SECRET'
  );


const HANDLED_EVENT_TYPES = new Set([
  'identity.verification_session.processing',
  'identity.verification_session.verified',
  'identity.verification_session.requires_input',
  'identity.verification_session.canceled',
]);


export const stripeIdentityWebhook =
  onRequest(
    {
      region: FUNCTION_REGION,
      maxInstances: 10,
      timeoutSeconds: 60,
      memory: '256MiB',
      secrets: [
        stripeSecretKey,
        stripeIdentityWebhookSecret,
      ],
    },
    async (request, response) => {
      if (request.method !== 'POST') {
        response
          .status(405)
          .set('Allow', 'POST')
          .send('Method Not Allowed');
        return;
      }

      const signature =
        request.headers['stripe-signature'];

      if (typeof signature !== 'string') {
        response
          .status(400)
          .send('Missing Stripe signature.');
        return;
      }

      const stripe =
        new Stripe(
          stripeSecretKey.value()
        );

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          request.rawBody,
          signature,
          stripeIdentityWebhookSecret.value()
        );
      } catch (error) {
        console.error(
          'Stripe Identity webhook signature verification failed.',
          error
        );

        response
          .status(400)
          .send('Invalid webhook signature.');
        return;
      }

      if (!HANDLED_EVENT_TYPES.has(event.type)) {
        response.status(200).json({
          received: true,
          handled: false,
        });
        return;
      }

      const verificationSession =
        event.data.object as
          Stripe.Identity.VerificationSession;

      try {
        if (
          verificationSession.metadata
            ?.purpose === 'offer_identity'
        ) {
          await updateOfferIdentityAccount(
            stripe,
            event,
            verificationSession
          );
        } else {
          await updateListingIdentity(
            stripe,
            event,
            verificationSession
          );
        }
      } catch (error) {
        console.error(
          'Stripe Identity webhook could not update Firestore.',
          {
            eventId: event.id,
            verificationSessionId:
              verificationSession.id,
            error,
          }
        );

        response
          .status(500)
          .send('Webhook processing failed.');
        return;
      }

      response.status(200).json({
        received: true,
        handled: true,
      });
    }
  );


async function updateOfferIdentityAccount(
  stripe: Stripe,
  event: Stripe.Event,
  verificationSession:
    Stripe.Identity.VerificationSession
): Promise<void> {
  const userUid =
    verificationSession.metadata
      ?.userUid
      ?.trim();

  if (!userUid) {
    throw new Error(
      'Offer identity session is missing userUid metadata.'
    );
  }

  const firestore =
    getFirestore();

  const userReference =
    firestore
      .collection('users')
      .doc(userUid);

  let verifiedSession =
    verificationSession;

  if (
    event.type ===
    'identity.verification_session.verified'
  ) {
    verifiedSession =
      await stripe.identity
        .verificationSessions
        .retrieve(
          verificationSession.id,
          {
            expand: [
              'verified_outputs',
            ],
          }
        );
  }

  const verifiedOutputs =
    event.type ===
      'identity.verification_session.verified'
      ? getVerifiedOutputs(
        verifiedSession
      )
      : null;

  await firestore.runTransaction(
    async transaction => {
      const userSnapshot =
        await transaction.get(
          userReference
        );

      if (!userSnapshot.exists) {
        throw new Error(
          'The verified NavStreet user account was not found.'
        );
      }

      const user =
        userSnapshot.data();

      const storedSessionId =
        user?.[
          'stripeIdentityVerificationSessionId'
        ] ??
        user?.[
          'identityVerificationSessionId'
        ];

      if (
        storedSessionId !==
        verificationSession.id
      ) {
        throw new Error(
          'The Stripe Identity session does not match the NavStreet user account.'
        );
      }

      if (
        user?.['identityStatus'] ===
          'verified' &&
        event.type !==
          'identity.verification_session.verified'
      ) {
        return;
      }

      const commonChanges = {
        stripeIdentityVerificationSessionId:
          verificationSession.id,
        'identityVerification.stripeVerificationSessionId':
          verificationSession.id,
        'identityVerification.lastWebhookEventId':
          event.id,
        'identityVerification.updatedAt':
          FieldValue.serverTimestamp(),
        updatedAt:
          FieldValue.serverTimestamp(),
      };

      switch (event.type) {
        case 'identity.verification_session.processing':
          transaction.update(
            userReference,
            {
              ...commonChanges,
              identityStatus:
                'processing',
              'identityVerification.status':
                'processing',
            }
          );
          break;

        case 'identity.verification_session.verified':
          if (!verifiedOutputs) {
            throw new Error(
              'Stripe did not return the verified legal name.'
            );
          }

          transaction.update(
            userReference,
            {
              ...commonChanges,
              identityStatus:
                'verified',
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
              'identityVerification.verifiedAt':
                FieldValue.serverTimestamp(),
              'identityVerification.lastErrorCode':
                FieldValue.delete(),
              'identityVerification.lastErrorReason':
                FieldValue.delete(),
            }
          );
          break;

        case 'identity.verification_session.requires_input':
          transaction.update(
            userReference,
            {
              ...commonChanges,
              identityStatus:
                'requires_input',
              'identityVerification.status':
                'requires_input',
              'identityVerification.lastErrorCode':
                verificationSession
                  .last_error?.code ??
                'verification_failed',
              'identityVerification.lastErrorReason':
                verificationSession
                  .last_error?.reason ??
                'Identity verification requires another attempt.',
            }
          );
          break;

        case 'identity.verification_session.canceled':
          transaction.update(
            userReference,
            {
              ...commonChanges,
              identityStatus:
                'canceled',
              'identityVerification.status':
                'canceled',
            }
          );
          break;
      }
    }
  );
}


async function updateListingIdentity(
  stripe: Stripe,
  event: Stripe.Event,
  verificationSession:
    Stripe.Identity.VerificationSession
): Promise<void> {
  const listingUid =
    verificationSession.metadata
      ?.listingUid
      ?.trim();

  const sellerUid =
    verificationSession.metadata
      ?.sellerUid
      ?.trim();

  if (!listingUid || !sellerUid) {
    throw new Error(
      'Listing identity session is missing required metadata.'
    );
  }

  const firestore =
    getFirestore();

  const draftReference =
    firestore
      .collection('listingDrafts')
      .doc(listingUid);

  await firestore.runTransaction(
    async transaction => {
      const draftSnapshot =
        await transaction.get(
          draftReference
        );

      if (!draftSnapshot.exists) {
        throw new Error(
          'The listing draft was not found.'
        );
      }

      const draft =
        draftSnapshot.data();

      if (draft?.['sellerUid'] !== sellerUid) {
        throw new Error(
          'The listing seller does not match the Stripe session.'
        );
      }

      const storedSessionId =
        draft?.['identityVerification']
          ?.stripeVerificationSessionId;

      if (
        storedSessionId !==
        verificationSession.id
      ) {
        throw new Error(
          'The Stripe Identity session does not match the listing draft.'
        );
      }

      if (
        draft?.['publication']
          ?.identityStatus === 'verified' &&
        event.type !==
          'identity.verification_session.verified'
      ) {
        return;
      }

      const commonChanges = {
        'identityVerification.stripeVerificationSessionId':
          verificationSession.id,
        'identityVerification.lastWebhookEventId':
          event.id,
        'identityVerification.updatedAt':
          FieldValue.serverTimestamp(),
        updatedAt:
          FieldValue.serverTimestamp(),
        lastSavedAt:
          FieldValue.serverTimestamp(),
      };

      switch (event.type) {
        case 'identity.verification_session.processing':
          transaction.update(
            draftReference,
            {
              ...commonChanges,
              'publication.identityStatus':
                'processing',
              'publication.status':
                'identity_required',
              'identityVerification.status':
                'processing',
            }
          );
          break;

        case 'identity.verification_session.verified':
          transaction.update(
            draftReference,
            {
              ...commonChanges,
              'publication.identityStatus':
                'verified',
              'publication.status':
                'payment_required',
              'identityVerification.status':
                'verified',
              'identityVerification.verifiedAt':
                FieldValue.serverTimestamp(),
              'identityVerification.lastErrorCode':
                FieldValue.delete(),
              'identityVerification.lastErrorReason':
                FieldValue.delete(),
            }
          );
          break;

        case 'identity.verification_session.requires_input':
          transaction.update(
            draftReference,
            {
              ...commonChanges,
              'publication.identityStatus':
                'requires_input',
              'publication.status':
                'identity_required',
              'identityVerification.status':
                'requires_input',
              'identityVerification.lastErrorCode':
                verificationSession
                  .last_error?.code ??
                'verification_failed',
              'identityVerification.lastErrorReason':
                verificationSession
                  .last_error?.reason ??
                'Identity verification requires another attempt.',
            }
          );
          break;

        case 'identity.verification_session.canceled':
          transaction.update(
            draftReference,
            {
              ...commonChanges,
              'publication.identityStatus':
                'canceled',
              'publication.status':
                'identity_required',
              'identityVerification.status':
                'canceled',
            }
          );
          break;
      }
    }
  );

  if (
    event.type ===
    'identity.verification_session.verified'
  ) {
    const verifiedSession =
      await stripe.identity
        .verificationSessions
        .retrieve(
          verificationSession.id,
          {
            expand: [
              'verified_outputs',
            ],
          }
        );

    const verifiedOutputs =
      getVerifiedOutputs(
        verifiedSession
      );

    await firestore
      .collection('users')
      .doc(sellerUid)
      .set(
        {
          identityStatus: 'verified',
          stripeIdentityVerificationSessionId:
            verificationSession.id,
          identityVerifiedAt:
            FieldValue.serverTimestamp(),
          verifiedFirstName:
            verifiedOutputs.firstName,
          verifiedMiddleName:
            verifiedOutputs.middleName,
          verifiedLastName:
            verifiedOutputs.lastName,
          identityVerification: {
            status: 'verified',
            stripeVerificationSessionId:
              verificationSession.id,
            verifiedAt:
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
  }
}


function getVerifiedOutputs(
  verificationSession:
    Stripe.Identity.VerificationSession
): {
  firstName: string;
  middleName: string | null;
  lastName: string;
} {
  const session =
    verificationSession as
      Stripe.Identity.VerificationSession & {
        verified_outputs?: {
          first_name?: string | null;
          last_name?: string | null;
        } | null;
      };

  const firstName =
    session.verified_outputs
      ?.first_name
      ?.trim();

  const lastName =
    session.verified_outputs
      ?.last_name
      ?.trim();

  if (!firstName || !lastName) {
    throw new Error(
      'Stripe did not return the verified legal name.'
    );
  }

  return {
    firstName,
    middleName: null,
    lastName,
  };
}
