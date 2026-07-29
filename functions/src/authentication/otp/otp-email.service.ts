import sgMail from "@sendgrid/mail";

import {
  OTP_EXPIRATION_MINUTES,
  OTP_FROM_EMAIL,
  OTP_FROM_NAME,
  OTP_SENDGRID_TEMPLATE_ID,
  SENDGRID_API_KEY,
} from "./otp-config";

/**
 * Sends a six-digit NavStreet OTP using a SendGrid
 * Dynamic Transactional Template.
 *
 * @param {string} email Recipient email address.
 * @param {string} code Six-digit verification code.
 * @return {Promise<void>} Resolves after SendGrid accepts the email.
 */
export async function sendOtpEmail(
  email: string,
  code: string,
): Promise<void> {
  const apiKey = SENDGRID_API_KEY.value();
  const fromEmail = OTP_FROM_EMAIL.value();
  const fromName = OTP_FROM_NAME.value();
  const templateId = OTP_SENDGRID_TEMPLATE_ID.value();

  if (!apiKey) {
    throw new Error(
      "SENDGRID_API_KEY has not been configured.",
    );
  }

  if (!fromEmail) {
    throw new Error(
      "OTP_FROM_EMAIL has not been configured.",
    );
  }

  if (!templateId) {
    throw new Error(
      "OTP_SENDGRID_TEMPLATE_ID has not been configured.",
    );
  }

  sgMail.setApiKey(apiKey);

  await sgMail.send({
    to: email,

    from: {
      email: fromEmail,
      name: fromName || "NavStreet",
    },

    templateId,

    dynamicTemplateData: {
      code,
      expirationMinutes: OTP_EXPIRATION_MINUTES,
      currentYear: new Date().getFullYear(),
    },
  });
}