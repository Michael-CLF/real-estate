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
  onRequest
} from 'firebase-functions/v2/https';

import {
  defineSecret
} from 'firebase-functions/params';

import {
  FUNCTION_REGION
} from '../shared/function-options';


if (getApps().length === 0) {
  initializeApp();
}


const stripeSecretKey =
  defineSecret('STRIPE_SECRET_KEY');

const stripeIdentityWebhookSecret =
  defineSecret('STRIPE_IDENTITY_WEBHOOK_SECRET');


export const stripeIdentityWebhook =
  onRequest(
    {
      region: FUNCTION_REGION,
      maxInstances: 10,
      timeoutSeconds: 60,
      memory: '256MiB',
      secrets: [
        stripeSecretKey,
        stripeIdentityWebhookSecret
      ]
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

      const handledEventTypes = new Set([
        'identity.verification_session.processing',
        'identity.verification_session.verified',
        'identity.verification_session.requires_input',
        'identity.verification_session.canceled'
      ]);

      if (!handledEventTypes.has(event.type)) {
        response.status(200).json({
          received: true,
          handled: false
        });

        return;
      }

      const verificationSession =
        event.data.object as
          Stripe.Identity.VerificationSession;

      const listingUid =
        verificationSession.metadata
          ?.listingUid
          ?.trim();

      const sellerUid =
        verificationSession.metadata
          ?.sellerUid
          ?.trim();

      if (!listingUid || !sellerUid) {
        console.error(
          'Stripe Identity webhook is missing required metadata.',
          {
            eventId: event.id,
            verificationSessionId:
              verificationSession.id
          }
        );

        response.status(200).json({
          received: true,
          handled: false
        });

        return;
      }

      const firestore =
        getFirestore();

      const draftReference =
        firestore
          .collection('listingDrafts')
          .doc(listingUid);

      try {
        await firestore.runTransaction(
          async transaction => {
            const draftSnapshot =
              await transaction.get(
                draftReference
              );

            if (!draftSnapshot.exists) {
              console.error(
                'Stripe Identity webhook listing draft was not found.',
                {
                  eventId: event.id,
                  listingUid,
                  sellerUid
                }
              );

              return;
            }

            const draft =
              draftSnapshot.data();

            if (draft?.['sellerUid'] !== sellerUid) {
              console.error(
                'Stripe Identity webhook seller ownership did not match.',
                {
                  eventId: event.id,
                  listingUid,
                  sellerUid
                }
              );

              return;
            }

            const storedSessionId =
              draft?.['identityVerification']
                ?.stripeVerificationSessionId;

            if (
              storedSessionId !==
              verificationSession.id
            ) {
              console.error(
                'Stripe Identity webhook session did not match the listing draft.',
                {
                  eventId: event.id,
                  listingUid,
                  storedSessionId,
                  receivedSessionId:
                    verificationSession.id
                }
              );

              return;
            }

            const currentIdentityStatus =
              draft?.['publication']
                ?.identityStatus;

            if (
              currentIdentityStatus === 'verified' &&
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
                FieldValue.serverTimestamp()
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
                      'processing'
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
                      FieldValue.delete()
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
                      'Identity verification requires another attempt.'
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
                      'canceled'
                  }
                );
                break;
            }
          }
        );
      } catch (error) {
        console.error(
          'Stripe Identity webhook could not update Firestore.',
          {
            eventId: event.id,
            listingUid,
            sellerUid,
            error
          }
        );

        response
          .status(500)
          .send('Webhook processing failed.');

        return;
      }

      response.status(200).json({
        received: true,
        handled: true
      });
    }
  );