import {
  createHash
} from 'node:crypto';

import sgMail from '@sendgrid/mail';

import {
  Timestamp
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
} from '../contact/contact-config';

import {
  adminFirestore
} from '../shared/firebase-admin';

import {
  callableFunctionOptions
} from '../shared/function-options';

interface AssistantContactRequestData {
  firstName?: unknown;
  email?: unknown;
  phone?: unknown;
  contactConsent?: unknown;
  website?: unknown;
  anonymousSessionUid?: unknown;
}

interface AssistantContactEmailData {
  firstName: string;
  email: string;
  phone: string;
}

const CONTACT_CONSENT_VERSION =
  '2026-09-06';

const MINIMUM_SUBMISSION_INTERVAL_MS =
  60_000;

export const submitAssistantContactRequest =
  onCall(
    {
      ...callableFunctionOptions,
      secrets: [
        SENDGRID_API_KEY
      ]
    },
    async request => {
      const data =
        request.data as
          AssistantContactRequestData;

      /*
       * Honeypot field. Real users will not
       * see or complete this field.
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

      if (firstName.length < 2) {
        throw new HttpsError(
          'invalid-argument',
          'First name must contain at least two characters.'
        );
      }

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
        normalizePhoneNumber(
          readString(
            data.phone,
            40
          )
        );

      if (
        data.contactConsent !== true
      ) {
        throw new HttpsError(
          'failed-precondition',
          'You must agree that NavStreet may contact you about your request.'
        );
      }

      const anonymousSessionUid =
        readString(
          data.anonymousSessionUid,
          200
        );

      const emailHash =
        createHash('sha256')
          .update(email)
          .digest('hex');

      const anonymousSessionHash =
        anonymousSessionUid
          ? createHash('sha256')
              .update(
                anonymousSessionUid
              )
              .digest('hex')
          : null;

      const contactRequestReference =
        adminFirestore
          .collection(
            'assistantContactRequests'
          )
          .doc();

      const rateLimitReference =
        adminFirestore
          .collection(
            'assistantContactRequestRateLimits'
          )
          .doc(emailHash);

      const now =
        Timestamp.now();

      await adminFirestore.runTransaction(
        async transaction => {
          const rateLimitSnapshot =
            await transaction.get(
              rateLimitReference
            );

          if (rateLimitSnapshot.exists) {
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
                MINIMUM_SUBMISSION_INTERVAL_MS
              ) {
                throw new HttpsError(
                  'resource-exhausted',
                  'Please wait a moment before submitting another contact request.'
                );
              }
            }
          }

          transaction.create(
            contactRequestReference,
            {
              uid:
                contactRequestReference.id,
              firstName,
              email,
              phone:
                phone || null,
              source:
                'navstreet-assistant',
              contactConsent:
                true,
              contactConsentVersion:
                CONTACT_CONSENT_VERSION,
              contactConsentedAt:
                now,
              anonymousSessionHash,
              authenticatedUserUid:
                request.auth?.uid ??
                null,
              emailStatus:
                'pending',
              status:
                'new',
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
        }
      );

      const emailData:
        AssistantContactEmailData = {
        firstName,
        email,
        phone
      };

      try {
        sgMail.setApiKey(
          SENDGRID_API_KEY.value()
        );

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
              firstName
          },
          subject:
            'New NavStreet Assistant contact request',
          text:
            createTextMessage(
              emailData
            ),
          html:
            createHtmlMessage(
              emailData
            )
        });

        await contactRequestReference.update({
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
          'Unable to send NavStreet Assistant contact request email.',
          {
            error,
            contactRequestUid:
              contactRequestReference.id
          }
        );

        await contactRequestReference.update({
          emailStatus:
            'failed',
          updatedAt:
            Timestamp.now()
        });

        /*
         * The request remains safely stored
         * in Firestore if SendGrid is
         * temporarily unavailable.
         */
      }

      return {
        accepted: true
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

function normalizePhoneNumber(
  value: string
): string {
  if (!value) {
    return '';
  }

  let digits =
    value.replace(
      /\D/g,
      ''
    );

  if (
    digits.length === 11 &&
    digits.startsWith('1')
  ) {
    digits =
      digits.slice(1);
  }

  if (digits.length !== 10) {
    throw new HttpsError(
      'invalid-argument',
      'Enter a valid 10-digit phone number.'
    );
  }

  return [
    '(',
    digits.slice(0, 3),
    ') ',
    digits.slice(3, 6),
    '-',
    digits.slice(6)
  ].join('');
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
  contact:
    AssistantContactEmailData
): string {
  return [
    'New NavStreet Assistant contact request',
    '',
    `First name: ${contact.firstName}`,
    `Email: ${contact.email}`,
    `Phone: ${
      contact.phone ||
      'Not provided'
    }`,
    '',
    'The visitor requested a follow-up after using the NavStreet Assistant.'
  ].join('\n');
}

function createHtmlMessage(
  contact:
    AssistantContactEmailData
): string {
  return `
    <h1>
      New NavStreet Assistant contact request
    </h1>

    <p>
      <strong>First name:</strong>
      ${escapeHtml(contact.firstName)}
    </p>

    <p>
      <strong>Email:</strong>
      ${escapeHtml(contact.email)}
    </p>

    <p>
      <strong>Phone:</strong>
      ${escapeHtml(
        contact.phone ||
        'Not provided'
      )}
    </p>

    <p>
      The visitor requested a follow-up after
      using the NavStreet Assistant.
    </p>
  `;
}