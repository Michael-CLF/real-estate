import Stripe from 'stripe';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  defineSecret,
  defineString
} from 'firebase-functions/params';

import {
  adminFirestore
} from '../shared/firebase-admin';

import {
  callableFunctionOptions
} from '../shared/function-options';

const stripeSecretKey =
  defineSecret('STRIPE_SECRET_KEY');

const navStreetAppUrl =
  defineString('NAVSTREET_APP_URL');

interface ProfessionalDocument {
  ownerUid?: string;
  businessName?: string;
  email?: string;

  status?: string;

  subscriptionStatus?:
    | 'free'
    | 'profile';

  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

interface ProfessionalBillingPortalResult {
  portalUrl: string;
}

export const createProfessionalBillingPortalSession =
  onCall<
    void,
    Promise<ProfessionalBillingPortalResult>
  >(
    {
      ...callableFunctionOptions,

      secrets: [
        stripeSecretKey
      ]
    },

    async request => {
      const ownerUid =
        request.auth?.uid;

      if (!ownerUid) {
        throw new HttpsError(
          'unauthenticated',
          'You must be signed in to manage your business subscription.'
        );
      }

      const professionalSnapshot =
        await adminFirestore
          .collection(
            'professionalProfiles'
          )
          .where(
            'ownerUid',
            '==',
            ownerUid
          )
          .limit(1)
          .get();

      const professionalDocument =
        professionalSnapshot.docs[0];

      if (!professionalDocument) {
        throw new HttpsError(
          'not-found',
          'A professional business account could not be found.'
        );
      }

      const professional =
        professionalDocument.data() as
          ProfessionalDocument;

      if (
        professional.ownerUid !==
        ownerUid
      ) {
        throw new HttpsError(
          'permission-denied',
          'You do not have permission to manage this business subscription.'
        );
      }

      if (
        professional.subscriptionStatus !==
        'profile'
      ) {
        throw new HttpsError(
          'failed-precondition',
          'This business does not currently have a Full Business Profile subscription.'
        );
      }

      const stripe =
        new Stripe(
          stripeSecretKey.value()
        );

      let stripeCustomerId =
        professional.stripeCustomerId
          ?.trim();

      /*
       * Older paid professional records may not have
       * stripeCustomerId stored yet. If necessary,
       * locate the customer from the active Stripe
       * subscription and repair the Firestore record.
       */
      if (
        !stripeCustomerId &&
        professional.stripeSubscriptionId
      ) {
        const subscription =
          await stripe.subscriptions.retrieve(
            professional
              .stripeSubscriptionId
          );

        stripeCustomerId =
          typeof subscription.customer ===
            'string'
            ? subscription.customer
            : subscription.customer.id;

        await professionalDocument.ref.update({
          stripeCustomerId
        });
      }

      /*
       * Final fallback for an older paid account:
       * locate the Stripe customer by the verified
       * business email and repair the Firestore record.
       */
      if (
        !stripeCustomerId &&
        professional.email?.trim()
      ) {
        const customers =
          await stripe.customers.list({
            email:
              professional.email.trim(),
            limit: 1
          });

        stripeCustomerId =
          customers.data[0]?.id;

        if (stripeCustomerId) {
          await professionalDocument.ref.update({
            stripeCustomerId
          });
        }
      }

      if (!stripeCustomerId) {
        throw new HttpsError(
          'failed-precondition',
          'The Stripe customer associated with this subscription could not be found.'
        );
      }

      const applicationUrl =
        navStreetAppUrl
          .value()
          .replace(/\/+$/, '');

      try {
        const portalSession =
          await stripe.billingPortal.sessions
            .create({
              customer:
                stripeCustomerId,

              return_url:
                `${applicationUrl}/dashboard`
            });

        return {
          portalUrl:
            portalSession.url
        };
      } catch (error: unknown) {
        console.error(
          'Unable to create the professional Stripe billing portal session:',
          {
            ownerUid,
            professionalUid:
              professionalDocument.id,
            stripeCustomerId,
            error
          }
        );

        throw new HttpsError(
          'internal',
          'The subscription management page could not be opened. Please try again.'
        );
      }
    }
  );