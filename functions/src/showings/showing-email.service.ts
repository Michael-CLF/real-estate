import sgMail from '@sendgrid/mail';

import {
  OTP_FROM_EMAIL,
  OTP_FROM_NAME,
  SENDGRID_API_KEY,
} from '../authentication/otp/otp-config';

import {
  SHOWING_REQUEST_SENDGRID_TEMPLATE_ID,
} from './showing-notification-config';

export interface SellerShowingRequestEmailData {
  sellerEmail: string;
  sellerName: string;

  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;

  propertyAddress: string;

  requestedDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  requestedTimeZone: string;

  buyerMessage: string;

  showingReferenceNumber: string;
  dashboardUrl: string;
}

/**
 * Sends a new showing-request notification to the
 * seller through a SendGrid Dynamic Template.
 */
export async function sendSellerShowingRequestEmail(
  data: SellerShowingRequestEmailData,
): Promise<void> {
  const apiKey =
    SENDGRID_API_KEY.value();

  const fromEmail =
    OTP_FROM_EMAIL.value();

  const fromName =
    OTP_FROM_NAME.value();

  const templateId =
    SHOWING_REQUEST_SENDGRID_TEMPLATE_ID
      .value();

  if (!apiKey) {
    throw new Error(
      'SENDGRID_API_KEY has not been configured.',
    );
  }

  if (!fromEmail) {
    throw new Error(
      'OTP_FROM_EMAIL has not been configured.',
    );
  }

  if (!templateId) {
    throw new Error(
      'SHOWING_REQUEST_SENDGRID_TEMPLATE_ID has not been configured.',
    );
  }

  sgMail.setApiKey(apiKey);

  await sgMail.send({
    to: data.sellerEmail,

    from: {
      email: fromEmail,
      name:
        fromName || 'NavStreet',
    },

    templateId,

    dynamicTemplateData: {
      sellerName:
        data.sellerName,

      buyerName:
        data.buyerName,

      buyerEmail:
        data.buyerEmail,

      buyerPhone:
        data.buyerPhone,

      propertyAddress:
        data.propertyAddress,

      requestedDate:
        data.requestedDate,

      requestedStartTime:
        data.requestedStartTime,

      requestedEndTime:
        data.requestedEndTime,

      requestedTimeZone:
        data.requestedTimeZone,

      buyerMessage:
        data.buyerMessage,

      showingReferenceNumber:
        data.showingReferenceNumber,

      dashboardUrl:
        data.dashboardUrl,

      currentYear:
        new Date().getFullYear(),
    },
  });
}