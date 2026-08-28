import {
  createHash
} from 'node:crypto';

import sgMail from '@sendgrid/mail';

import {
  getApps,
  initializeApp
} from 'firebase-admin/app';

import {
  Timestamp,
  getFirestore
} from 'firebase-admin/firestore';

import {
  HttpsError,
  onCall
} from 'firebase-functions/v2/https';

import {
  logger
} from 'firebase-functions';

import {
  OTP_FROM_EMAIL,
  OTP_FROM_NAME,
  SENDGRID_API_KEY
} from '../authentication/otp/otp-config';

import {
  CONTACT_INQUIRY_TO_EMAIL
} from './contact-config';

if (getApps().length === 0) {
  initializeApp();
}

interface ContactInquiryRequest {
  email?: unknown;
  firstName?: unknown;
  interest?: unknown;
  lastName?: unknown;
  marketingConsent?: unknown;
  message?: unknown;
  phone?: unknown;
  state?: unknown;
  website?: unknown;
}

interface ContactMessageData {
  email: string;
  firstName: string;
  interest: string;
  lastName: string;
  marketingConsent: boolean;
  message: string;
  phone: string;
  state: string;
}

const ALLOWED_INTERESTS =
  new Set([
    'buying',
    'selling',
    'financing',
    'professional-partner',
    'business-expansion',
    'state-launch',
    'general',
    'other'
  ]);

const MARKETING_CONSENT_VERSION =
  '2026-08-28';

export const submitContactInquiry =
  onCall(
    {
      secrets: [
        SENDGRID_API_KEY
      ]
    },
    async request => {
      const data =
        request.data as
          ContactInquiryRequest;

      /*
       * Honeypot field. Bots commonly fill hidden
       * fields. Return success without creating an
       * inquiry or sending an email.
       */
      const website =
        readString(
          data.website,
          200
        );

      if (website) {
        return {
          accepted: true
        };
      }

      const firstName =
        readRequiredString(
          data.firstName,
          'First name',
          100
        );

      const lastName =
        readRequiredString(
          data.lastName,
          'Last name',
          100
        );

      const email =
        readRequiredString(
          data.email,
          'Email',
          254
        ).toLowerCase();

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
          .test(email)
      ) {
        throw new HttpsError(
          'invalid-argument',
          'Enter a valid email address.'
        );
      }

      const phone =
        readString(
          data.phone,
          40
        );

      const state =
        readString(
          data.state,
          100
        );

      const message =
        readRequiredString(
          data.message,
          'Message',
          5000
        );

      if (message.length < 10) {
        throw new HttpsError(
          'invalid-argument',
          'The message must contain at least 10 characters.'
        );
      }

      const requestedInterest =
        readString(
          data.interest,
          100
        );

      const interest =
        ALLOWED_INTERESTS.has(
          requestedInterest
        )
          ? requestedInterest
          : 'general';

      const marketingConsent =
        data.marketingConsent === true;

      const source =
        state
          ? 'state-page'
          : 'contact-page';

      const database =
        getFirestore();

      const inquiryReference =
        database
          .collection(
            'contactInquiries'
          )
          .doc();

      /*
       * The normalized email hash is used as the
       * document ID for rate limiting and marketing
       * subscriber deduplication. The actual email is
       * not exposed in either document ID.
       */
      const emailHash =
        createHash('sha256')
          .update(email)
          .digest('hex');

      const rateLimitReference =
        database
          .collection(
            'contactInquiryRateLimits'
          )
          .doc(emailHash);

      const subscriberReference =
        database
          .collection(
            'marketingSubscribers'
          )
          .doc(emailHash);

      const now =
        Timestamp.now();

      await database.runTransaction(
        async transaction => {
          /*
           * All transaction reads occur before any
           * transaction writes.
           */
          const rateLimitSnapshot =
            await transaction.get(
              rateLimitReference
            );

          const subscriberSnapshot =
            marketingConsent
              ? await transaction.get(
                  subscriberReference
                )
              : null;

          if (
            rateLimitSnapshot.exists
          ) {
            const lastSubmittedAt =
              rateLimitSnapshot.get(
                'lastSubmittedAt'
              );

            if (
              lastSubmittedAt &&
              typeof lastSubmittedAt
                .toMillis ===
                'function'
            ) {
              const elapsedMilliseconds =
                now.toMillis() -
                lastSubmittedAt
                  .toMillis();

              if (
                elapsedMilliseconds <
                60_000
              ) {
                throw new HttpsError(
                  'resource-exhausted',
                  'Please wait a moment before sending another message.'
                );
              }
            }
          }

          transaction.set(
            inquiryReference,
            {
              uid:
                inquiryReference.id,
              firstName,
              lastName,
              email,
              phone:
                phone || null,
              interest,
              state:
                state || null,
              message,
              source,
              marketingConsent,
              marketingConsentVersion:
                marketingConsent
                  ? MARKETING_CONSENT_VERSION
                  : null,
              marketingConsentedAt:
                marketingConsent
                  ? now
                  : null,
              emailStatus:
                'pending',
              createdAt:
                now,
              updatedAt:
                now
            }
          );

          transaction.set(
            rateLimitReference,
            {
              lastSubmittedAt:
                now,
              updatedAt:
                now
            },
            {
              merge: true
            }
          );

          /*
           * Only users who explicitly checked the
           * email consent box are added to the
           * marketingSubscribers collection.
           *
           * Phone numbers are intentionally excluded.
           */
          if (
            marketingConsent &&
            subscriberSnapshot
          ) {
            transaction.set(
              subscriberReference,
              {
                uid:
                  subscriberReference.id,
                email,
                firstName,
                lastName,
                interest,
                state:
                  state || null,
                source,
                status:
                  'active',
                consentVersion:
                  MARKETING_CONSENT_VERSION,
                consentedAt:
                  now,
                updatedAt:
                  now,
                ...(
                  subscriberSnapshot.exists
                    ? {}
                    : {
                        createdAt:
                          now,
                        firstConsentedAt:
                          now
                      }
                )
              },
              {
                merge: true
              }
            );
          }
        }
      );

      const messageData:
        ContactMessageData = {
          email,
          firstName,
          interest,
          lastName,
          marketingConsent,
          message,
          phone,
          state
        };

      try {
        sgMail.setApiKey(
          SENDGRID_API_KEY.value()
        );

        const fullName =
          `${firstName} ${lastName}`;

        await sgMail.send({
          to:
            CONTACT_INQUIRY_TO_EMAIL
              .value(),
          from: {
            email:
              OTP_FROM_EMAIL.value(),
            name:
              OTP_FROM_NAME.value()
          },
          replyTo: {
            email,
            name:
              fullName
          },
          subject:
            state
              ? `NavStreet inquiry about ${state}`
              : 'New NavStreet contact inquiry',
          text:
            createTextMessage(
              messageData
            ),
          html:
            createHtmlMessage(
              messageData
            )
        });

        await inquiryReference.update({
          emailStatus:
            'sent',
          emailSentAt:
            Timestamp.now(),
          updatedAt:
            Timestamp.now()
        });
      } catch (
        error: unknown
      ) {
        logger.error(
          'Unable to send contact inquiry email.',
          {
            error,
            inquiryUid:
              inquiryReference.id
          }
        );

        await inquiryReference.update({
          emailStatus:
            'failed',
          updatedAt:
            Timestamp.now()
        });

        /*
         * The inquiry remains safely stored in
         * Firestore if SendGrid is temporarily
         * unavailable.
         */
      }

      return {
        accepted: true,
        inquiryUid:
          inquiryReference.id
      };
    }
  );

function readRequiredString(
  value: unknown,
  label: string,
  maximumLength: number
): string {
  const result =
    readString(
      value,
      maximumLength
    );

  if (!result) {
    throw new HttpsError(
      'invalid-argument',
      `${label} is required.`
    );
  }

  return result;
}

function readString(
  value: unknown,
  maximumLength: number
): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .slice(
      0,
      maximumLength
    );
}

function escapeHtml(
  value: string
): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createTextMessage(
  inquiry: ContactMessageData
): string {
  return [
    'New NavStreet contact inquiry',
    '',
    `Name: ${inquiry.firstName} ${inquiry.lastName}`,
    `Email: ${inquiry.email}`,
    `Phone: ${inquiry.phone || 'Not provided'}`,
    `Interest: ${inquiry.interest}`,
    `State: ${inquiry.state || 'Not provided'}`,
    `Marketing email consent: ${
      inquiry.marketingConsent
        ? 'Yes'
        : 'No'
    }`,
    '',
    'Message:',
    inquiry.message
  ].join('\n');
}

function createHtmlMessage(
  inquiry: ContactMessageData
): string {
  const formattedMessage =
    escapeHtml(
      inquiry.message
    ).replace(
      /\n/g,
      '<br>'
    );

  const marketingConsent =
    inquiry.marketingConsent
      ? 'Yes'
      : 'No';

  return `
    <h1>New NavStreet contact inquiry</h1>

    <p>
      <strong>Name:</strong>
      ${escapeHtml(inquiry.firstName)}
      ${escapeHtml(inquiry.lastName)}
    </p>

    <p>
      <strong>Email:</strong>
      ${escapeHtml(inquiry.email)}
    </p>

    <p>
      <strong>Phone:</strong>
      ${escapeHtml(
        inquiry.phone ||
        'Not provided'
      )}
    </p>

    <p>
      <strong>Interest:</strong>
      ${escapeHtml(inquiry.interest)}
    </p>

    <p>
      <strong>State:</strong>
      ${escapeHtml(
        inquiry.state ||
        'Not provided'
      )}
    </p>

    <p>
      <strong>Marketing email consent:</strong>
      ${marketingConsent}
    </p>

    <p>
      <strong>Message:</strong><br>
      ${formattedMessage}
    </p>
  `;
}