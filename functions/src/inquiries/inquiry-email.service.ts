import sgMail from '@sendgrid/mail';

import {
  OTP_FROM_EMAIL,
  OTP_FROM_NAME,
  SENDGRID_API_KEY,
} from '../authentication/otp/otp-config';

import {
  LISTING_INQUIRY_SENDGRID_TEMPLATE_ID,
} from './inquiry-notification-config';

export interface SellerListingInquiryEmailData {
  sellerEmail: string;
  sellerName: string;

  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;

  propertyAddress: string;
  buyerMessage: string;

  inquiryReferenceNumber: string;
  dashboardUrl: string;
}

/**
 * Sends a new listing-inquiry notification to the
 * seller through a SendGrid Dynamic Template.
 */
export async function sendSellerListingInquiryEmail(
  data: SellerListingInquiryEmailData,
): Promise<void> {
  const apiKey =
    SENDGRID_API_KEY.value();

  const fromEmail =
    OTP_FROM_EMAIL.value();

  const fromName =
    OTP_FROM_NAME.value();

  const templateId =
    LISTING_INQUIRY_SENDGRID_TEMPLATE_ID
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
      'LISTING_INQUIRY_SENDGRID_TEMPLATE_ID has not been configured.',
    );
  }

  sgMail.setApiKey(apiKey);

  await sgMail.send({
    to:
      data.sellerEmail,

    from: {
      email:
        fromEmail,

      name:
        fromName || 'NavStreet',
    },

    templateId,

    dynamicTemplateData: {
      subject:
        `New buyer inquiry for ${data.propertyAddress}`,

      previewText:
        `${data.buyerName} sent a question about your NavStreet listing.`,

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

      buyerMessage:
        data.buyerMessage,

      inquiryReferenceNumber:
        data.inquiryReferenceNumber,

      dashboardUrl:
        data.dashboardUrl,

      currentYear:
        new Date().getFullYear(),
    },
  });
}