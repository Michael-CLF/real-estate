import sgMail from '@sendgrid/mail';

import {
  OTP_FROM_EMAIL,
  OTP_FROM_NAME,
  SENDGRID_API_KEY,
} from '../authentication/otp/otp-config';

import {
  SHOWING_REQUEST_SENDGRID_TEMPLATE_ID,
  SHOWING_RESPONSE_SENDGRID_TEMPLATE_ID,
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

export type BuyerShowingStatusEmailKind =
  | 'confirmed'
  | 'declined'
  | 'alternate_proposed'
  | 'cancelled';

export interface BuyerShowingStatusEmailData {
  buyerEmail: string;
  buyerName: string;

  status:
  BuyerShowingStatusEmailKind;

  propertyAddress: string;

  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  appointmentTimeZone: string;

  sellerMessage: string;

  showingReferenceNumber: string;
  actionUrl: string;
}

export type SellerBuyerShowingResponseEmailKind =
  | 'accepted'
  | 'declined';

export interface SellerBuyerShowingResponseEmailData {
  sellerEmail: string;
  sellerName: string;

  response:
  SellerBuyerShowingResponseEmailKind;

  buyerName: string;
  propertyAddress: string;

  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  appointmentTimeZone: string;

  showingReferenceNumber: string;
  actionUrl: string;
}

interface SellerBuyerShowingResponseContent {
  subject: string;
  previewText: string;
  statusEyebrow: string;
  statusHeading: string;
  statusMessage: string;
  appointmentHeading: string;
  actionButtonLabel: string;
  statusNotice: string;
}

interface BuyerShowingStatusContent {
  subject: string;
  previewText: string;
  statusEyebrow: string;
  statusHeading: string;
  statusMessage: string;
  appointmentHeading: string;
  actionButtonLabel: string;
  statusNotice: string;
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

/**
 * Sends a buyer an email when the status of their
 * showing request changes.
 */
export async function sendBuyerShowingStatusEmail(
  data: BuyerShowingStatusEmailData,
): Promise<void> {
  const apiKey =
    SENDGRID_API_KEY.value();

  const fromEmail =
    OTP_FROM_EMAIL.value();

  const fromName =
    OTP_FROM_NAME.value();

  const templateId =
    SHOWING_RESPONSE_SENDGRID_TEMPLATE_ID
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
      'SHOWING_RESPONSE_SENDGRID_TEMPLATE_ID has not been configured.',
    );
  }

  const content =
    getBuyerShowingStatusContent(
      data.status,
      data.propertyAddress,
    );

  sgMail.setApiKey(apiKey);

  await sgMail.send({
    to:
      data.buyerEmail,

    from: {
      email:
        fromEmail,

      name:
        fromName || 'NavStreet',
    },

    templateId,

    dynamicTemplateData: {
      subject:
        content.subject,

      previewText:
        content.previewText,

      statusEyebrow:
        content.statusEyebrow,

      statusHeading:
        content.statusHeading,

      statusMessage:
        content.statusMessage,

      buyerName:
        data.buyerName,

      propertyAddress:
        data.propertyAddress,

      appointmentHeading:
        content.appointmentHeading,

      appointmentDate:
        data.appointmentDate,

      appointmentStartTime:
        data.appointmentStartTime,

      appointmentEndTime:
        data.appointmentEndTime,

      appointmentTimeZone:
        data.appointmentTimeZone,

      sellerMessage:
        data.sellerMessage,

      actionUrl:
        data.actionUrl,

      actionButtonLabel:
        content.actionButtonLabel,

      statusNotice:
        content.statusNotice,

      showingReferenceNumber:
        data.showingReferenceNumber,

      currentYear:
        new Date().getFullYear(),
    },
  });
}

/**
 * Notifies a seller when the buyer accepts or declines
 * a proposed alternate showing time.
 */
export async function sendSellerBuyerShowingResponseEmail(
  data: SellerBuyerShowingResponseEmailData,
): Promise<void> {
  const apiKey =
    SENDGRID_API_KEY.value();

  const fromEmail =
    OTP_FROM_EMAIL.value();

  const fromName =
    OTP_FROM_NAME.value();

  const templateId =
    SHOWING_RESPONSE_SENDGRID_TEMPLATE_ID
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
      'SHOWING_RESPONSE_SENDGRID_TEMPLATE_ID has not been configured.',
    );
  }

  const content =
    getSellerBuyerShowingResponseContent(
      data.response,
      data.buyerName,
      data.propertyAddress,
    );

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
        content.subject,

      previewText:
        content.previewText,

      statusEyebrow:
        content.statusEyebrow,

      statusHeading:
        content.statusHeading,

      statusMessage:
        content.statusMessage,

      /*
       * The existing SendGrid template uses buyerName
       * as its greeting variable. For this seller-facing
       * message, it receives the seller's name.
       */
      buyerName:
        data.sellerName,

      propertyAddress:
        data.propertyAddress,

      appointmentHeading:
        content.appointmentHeading,

      appointmentDate:
        data.appointmentDate,

      appointmentStartTime:
        data.appointmentStartTime,

      appointmentEndTime:
        data.appointmentEndTime,

      appointmentTimeZone:
        data.appointmentTimeZone,

      sellerMessage:
        '',

      actionUrl:
        data.actionUrl,

      actionButtonLabel:
        content.actionButtonLabel,

      statusNotice:
        content.statusNotice,

      showingReferenceNumber:
        data.showingReferenceNumber,

      currentYear:
        new Date().getFullYear(),
    },
  });
}

function getBuyerShowingStatusContent(
  status: BuyerShowingStatusEmailKind,
  propertyAddress: string,
): BuyerShowingStatusContent {
  switch (status) {
    case 'confirmed':
      return {
        subject:
          'Your NavStreet showing is confirmed',

        previewText:
          `Your showing of ${propertyAddress} has been confirmed.`,

        statusEyebrow:
          'Showing confirmed',

        statusHeading:
          'Your showing is confirmed',

        statusMessage:
          'Your showing appointment is now confirmed. The confirmed appointment details appear below.',

        appointmentHeading:
          'Confirmed appointment',

        actionButtonLabel:
          'View Showing Details',

        statusNotice:
          'Your appointment is confirmed. Please cancel the showing if your plans change.',
      };

    case 'declined':
      return {
        subject:
          'Update about your NavStreet showing request',

        previewText:
          `The seller could not accept your showing request for ${propertyAddress}.`,

        statusEyebrow:
          'Showing request declined',

        statusHeading:
          'The seller could not accept this request',

        statusMessage:
          'The seller was unable to accommodate the requested showing appointment.',

        appointmentHeading:
          'Requested appointment',

        actionButtonLabel:
          'View Showing Request',

        statusNotice:
          'You may contact the seller or submit another request if other showing times are available.',
      };

    case 'alternate_proposed':
      return {
        subject:
          'The seller proposed another showing time',

        previewText:
          `The seller proposed another time for your showing of ${propertyAddress}.`,

        statusEyebrow:
          'Alternate time proposed',

        statusHeading:
          'The seller suggested another time',

        statusMessage:
          'The seller reviewed your showing request and proposed the alternate appointment below.',

        appointmentHeading:
          'Proposed appointment',

        actionButtonLabel:
          'Review Proposed Time',

        statusNotice:
          'This proposed appointment is not confirmed until you accept it.',
      };

    case 'cancelled':
      return {
        subject:
          'Your NavStreet showing was cancelled',

        previewText:
          `Your showing of ${propertyAddress} has been cancelled.`,

        statusEyebrow:
          'Showing cancelled',

        statusHeading:
          'This showing has been cancelled',

        statusMessage:
          'The scheduled showing is no longer active. Review the showing details below for your records.',

        appointmentHeading:
          'Cancelled appointment',

        actionButtonLabel:
          'View Showing Details',

        statusNotice:
          'If you are still interested in this property, contact the seller or request another available time.',
      };
  }
}

function getSellerBuyerShowingResponseContent(
  response:
    SellerBuyerShowingResponseEmailKind,
  buyerName: string,
  propertyAddress: string,
): SellerBuyerShowingResponseContent {
  switch (response) {
    case 'accepted':
      return {
        subject:
          'The buyer accepted your proposed showing time',

        previewText:
          `${buyerName} accepted the proposed showing time for ${propertyAddress}.`,

        statusEyebrow:
          'Alternate time accepted',

        statusHeading:
          'The buyer accepted your proposed time',

        statusMessage:
          `${buyerName} accepted the alternate appointment you proposed.`,

        appointmentHeading:
          'Confirmed appointment',

        actionButtonLabel:
          'Review Showing Request',

        statusNotice:
          'This appointment is now confirmed and the time remains reserved.',
      };

    case 'declined':
      return {
        subject:
          'The buyer declined your proposed showing time',

        previewText:
          `${buyerName} declined the proposed showing time for ${propertyAddress}.`,

        statusEyebrow:
          'Alternate time declined',

        statusHeading:
          'The buyer declined your proposed time',

        statusMessage:
          `${buyerName} declined the alternate appointment you proposed.`,

        appointmentHeading:
          'Declined appointment',

        actionButtonLabel:
          'Review Showing Request',

        statusNotice:
          'This showing request is cancelled and the appointment time has been released.',
      };
  }
}